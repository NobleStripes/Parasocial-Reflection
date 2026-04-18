import express from "express";
import type { Request, Response } from "express";
import { getProviderName, getSupportedProviderNames, performAuditAnalysis } from "./auditProvider";
import { getPrivacyConfig } from "./privacy";
import { listConfiguredResearchModels, resolveConfiguredResearchModel } from "./researchModelRegistry";
import { applyCors, applySecurityHeaders, createRateLimiter, getSecurityConfig } from "./security";
import { scrubPIIText } from "../shared/piiScrubber";
import { getThresholdProfile, listThresholdProfiles } from "../shared/thresholdProfiles";

export interface SessionStore {
  create(input: { researcherId: string; dependencyScore: number; data: unknown; notes?: string }): {
    id: number;
    delta: number;
  };
  listByResearcher(researcherId: string): unknown[];
  listAllFlat(): unknown[];
}

export interface CreateAppOptions {
  sessionRepository: SessionStore;
}

export function createApp(options: CreateAppOptions) {
  const app = express();
  const security = getSecurityConfig();
  const privacy = getPrivacyConfig();

  applyCors(app, security);
  applySecurityHeaders(app, security);
  app.use(createRateLimiter(security));
  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", provider: getProviderName() });
  });

  app.get("/api/providers", (_req: Request, res: Response) => {
    res.json({ providers: getSupportedProviderNames() });
  });

  app.get("/api/privacy-config", (_req: Request, res: Response) => {
    res.json({
      privacyConfig: {
        hashResearcherId: privacy.hashResearcherId,
        storeRawData: privacy.storeRawData,
        maxNotesChars: privacy.maxNotesChars,
        piiScrubberEnabled: privacy.piiScrubberEnabled,
      },
      securityConfig: {
        rateLimitWindowMs: security.rateLimitWindowMs,
        rateLimitMaxRequests: security.rateLimitMaxRequests,
        maxTranscriptChars: security.maxTranscriptChars,
      },
    });
  });

  app.get("/api/threshold-profiles", (_req: Request, res: Response) => {
    res.json({ profiles: listThresholdProfiles() });
  });

  app.post("/api/pii/scrub", (req: Request, res: Response) => {
    const { text, appendWarning } = req.body ?? {};

    if (typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }

    if (!privacy.piiScrubberEnabled) {
      return res.json({
        redactedText: text,
        findings: [],
        totalMatches: 0,
        warningAppended: false,
      });
    }

    const scrubbed = scrubPIIText(text, appendWarning !== false);
    return res.json(scrubbed);
  });

  app.get("/api/research-basis", (_req: Request, res: Response) => {
    const activeModel = resolveConfiguredResearchModel();
    const availableModels = listConfiguredResearchModels().map((model) => ({
      id: model.id,
      name: model.name,
      referenceCount: model.references.length,
    }));

    res.json({
      activeModel,
      pinnedModelId: process.env.RESEARCH_MODEL_ID || null,
      availableModels,
    });
  });

  app.post("/api/audit", async (req: Request, res: Response) => {
    const { text, images, sensitivity, thresholdProfileId, researchModelId } = req.body ?? {};

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }

    if (text.length > security.maxTranscriptChars) {
      return res.status(400).json({ error: `text exceeds max length (${security.maxTranscriptChars})` });
    }

    try {
      const pii = privacy.piiScrubberEnabled
        ? scrubPIIText(text, false)
        : { redactedText: text, findings: [], totalMatches: 0, warningAppended: false };

      const result = await performAuditAnalysis({
        text: pii.redactedText,
        images: Array.isArray(images) ? images : [],
        sensitivity: typeof sensitivity === "number" ? sensitivity : 50,
        thresholdProfileId: typeof thresholdProfileId === "string" ? thresholdProfileId : undefined,
        researchModel: resolveConfiguredResearchModel(
          typeof researchModelId === "string" ? researchModelId : undefined
        ),
      });

      return res.json({
        ...result,
        piiScrubSummary: {
          findings: pii.findings,
          totalMatches: pii.totalMatches,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audit failed";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/api/audit/compare", async (req: Request, res: Response) => {
    const { text, images, sensitivity, profileIds, researchModelId } = req.body ?? {};

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "text is required" });
    }

    if (text.length > security.maxTranscriptChars) {
      return res.status(400).json({ error: `text exceeds max length (${security.maxTranscriptChars})` });
    }

    if (!Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({ error: "profileIds array is required" });
    }

    try {
      const pii = privacy.piiScrubberEnabled
        ? scrubPIIText(text, false)
        : { redactedText: text, findings: [], totalMatches: 0, warningAppended: false };

      const comparisons = await Promise.all(
        profileIds.map(async (id) => {
          const profileId = typeof id === "string" ? id : "";
          const result = await performAuditAnalysis({
            text: pii.redactedText,
            images: Array.isArray(images) ? images : [],
            sensitivity: typeof sensitivity === "number" ? sensitivity : 50,
            thresholdProfileId: profileId,
            researchModel: resolveConfiguredResearchModel(
              typeof researchModelId === "string" ? researchModelId : undefined
            ),
          });

          const profile = getThresholdProfile(profileId);
          return {
            profileId: profile.id,
            profileName: profile.name,
            profileVersion: profile.version,
            classification: result.classification,
            confidence: result.confidence,
            iadRiskLevel: result.researchData.iadRiskLevel,
            salience: result.clinicalData.griffithsScores.salience,
            totalScore: Object.values(result.clinicalData.griffithsScores).reduce((sum, value) => sum + value, 0),
          };
        })
      );

      return res.json({
        comparisons,
        piiScrubSummary: {
          findings: pii.findings,
          totalMatches: pii.totalMatches,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Comparison failed";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/api/sessions", (req: Request, res: Response) => {
    const { researcherId, dependencyScore, data, notes } = req.body ?? {};

    if (typeof researcherId !== "string" || researcherId.trim().length === 0) {
      return res.status(400).json({ error: "researcherId is required" });
    }

    const saved = options.sessionRepository.create({
      researcherId,
      dependencyScore: Number(dependencyScore || 0),
      data,
      notes: typeof notes === "string" ? notes : "",
    });

    return res.json({
      id: saved.id,
      delta: saved.delta,
      message: "Session stored",
    });
  });

  app.get("/api/sessions/:researcherId", (req: Request, res: Response) => {
    const sessions = options.sessionRepository.listByResearcher(req.params.researcherId);
    return res.json(sessions);
  });

  app.get("/api/export/json", (_req: Request, res: Response) => {
    return res.json(options.sessionRepository.listAllFlat());
  });

  return app;
}
