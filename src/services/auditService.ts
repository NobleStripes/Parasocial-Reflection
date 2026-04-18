import type { AuditImage, AuditResult } from "../shared/auditCore";
import type { PsychiatricResearchModel } from "../shared/psychiatricResearch";
import type { ThresholdProfile } from "../shared/thresholdProfiles";

export { Classification } from "../shared/auditCore";
export type {
  AuditImage,
  AuditResult,
  ClinicalData,
  ComputedMetrics,
  ConnectionPattern,
  EvidenceMarker,
  GriffithsComponents,
  HeatmapData,
  ImagineAnalysis,
  Recommendation,
  ResearchData,
  SemanticAnalysis,
  TokenAttribution,
} from "../shared/auditCore";

export interface SaveSessionInput {
  researcherId: string;
  dependencyScore: number;
  data: unknown;
  notes?: string;
}

export interface AuditComparisonResult {
  profileId: string;
  profileName: string;
  profileVersion: string;
  classification: string;
  confidence: number;
  iadRiskLevel: string;
  salience: number;
  totalScore: number;
}

export interface ResearchBasisResponse {
  activeModel: PsychiatricResearchModel;
  pinnedModelId: string | null;
  availableModels: Array<{
    id: string;
    name: string;
    referenceCount: number;
  }>;
}

async function parseJsonOrThrow(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "Request failed");
  }
  return payload;
}

export async function performForensicAudit(
  text: string,
  images: AuditImage[] = [],
  sensitivity = 50,
  thresholdProfileId?: string,
  researchModelId?: string
): Promise<AuditResult> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, images, sensitivity, thresholdProfileId, researchModelId }),
  });

  return parseJsonOrThrow(response) as Promise<AuditResult>;
}

export async function compareAuditProfiles(
  text: string,
  profileIds: string[],
  images: AuditImage[] = [],
  sensitivity = 50,
  researchModelId?: string
): Promise<AuditComparisonResult[]> {
  const response = await fetch("/api/audit/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, profileIds, images, sensitivity, researchModelId }),
  });

  const payload = (await parseJsonOrThrow(response)) as { comparisons: AuditComparisonResult[] };
  return payload.comparisons;
}

export async function saveSession(input: SaveSessionInput): Promise<{ id: number; delta: number; message: string }> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return parseJsonOrThrow(response) as Promise<{ id: number; delta: number; message: string }>;
}

export async function listSessions(researcherId: string): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(researcherId)}`);
  return parseJsonOrThrow(response) as Promise<Array<Record<string, unknown>>>;
}

export async function listProviders(): Promise<string[]> {
  const response = await fetch("/api/providers");
  const payload = (await parseJsonOrThrow(response)) as { providers: string[] };
  return payload.providers;
}

export async function listThresholdProfiles(): Promise<ThresholdProfile[]> {
  const response = await fetch("/api/threshold-profiles");
  const payload = (await parseJsonOrThrow(response)) as { profiles: ThresholdProfile[] };
  return payload.profiles;
}

export async function getResearchBasis(): Promise<ResearchBasisResponse> {
  const response = await fetch("/api/research-basis");
  return (await parseJsonOrThrow(response)) as ResearchBasisResponse;
}
