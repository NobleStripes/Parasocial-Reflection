import { scrubPII } from "../lib/utils";
import {
  ANTHROPOMORPHIC_PHRASES,
  DEPENDENCY_PHRASES,
  IDENTITY_PHRASES,
  PRODUCT_COMPLAINTS,
  UPDATE_GRIEF_PHRASES,
} from "../researchConfig";
import { getPsychiatricResearchModel, type PsychiatricResearchModel } from "./psychiatricResearch";
import { getThresholdProfile, type ThresholdProfile } from "./thresholdProfiles";

export enum Classification {
  FUNCTIONAL_UTILITY = "Functional Utility",
  RELATIONAL_PROXIMITY = "Relational Proximity",
  AFFECTIVE_DEPENDENCE = "Affective Dependence",
  PARASOCIAL_FUSION = "Parasocial Fusion",
  PATHOLOGICAL_DEPENDENCE = "Pathological Dependence",
}

export interface HeatmapData {
  category: string;
  score: number;
  description: string;
}

export interface ConnectionPattern {
  name: string;
  intensity: number;
  description: string;
}

export interface Recommendation {
  text: string;
  protocol: string;
  protocolExplanation: string;
}

export interface GriffithsComponents {
  salience: number;
  moodModification: number;
  tolerance: number;
  withdrawal: number;
  conflict: number;
  relapse: number;
}

export interface SemanticAnalysis {
  linguisticSynchrony: number;
  pronominalShiftDetected: boolean;
  affectiveLabilityScore: number;
  qualitativeMarkers: string[];
}

export interface ImagineAnalysis {
  identity: number;
  mirroring: number;
  affectiveLoop: number;
  gapsInReality: number;
  intimacyIllusion: number;
  nonReciprocity: number;
  escalation: number;
}

export interface ComputedMetrics {
  wordCount: number;
  turnCount: number;
  pronounRatio: number;
  dependencyPhraseCount: number;
  updateGriefCount: number;
  productComplaintCount: number;
  anthropomorphicCount: number;
}

export interface ClinicalData {
  griffithsScores: GriffithsComponents;
  imagineAnalysis: ImagineAnalysis;
  iPACEAnalysis: {
    inhibitionFailure: string;
    cognitiveBias: string;
  };
  semanticAnalysis: SemanticAnalysis;
  diagnosticMarkers: {
    linguisticMirroring: number;
    validationToUtilityRatio: string;
    urgencyFlag: boolean;
  };
}

export interface ResearchData {
  confidenceScore: number;
  linguisticMarkers: string[];
  attachmentStyle: string;
  iadRiskLevel: "Low" | "Moderate" | "High" | "Critical";
}

export interface TokenAttribution {
  heuristic: string;
  phrases: string[];
}

export interface EvidenceMarker {
  quote: string;
  component: string;
  rationale: string;
}

export interface AuditResult {
  classification: Classification;
  confidence: number;
  summary: string;
  clinicalData: ClinicalData;
  legacyAttachment: number;
  versionMourningTriggered: boolean;
  connectionPatterns: ConnectionPattern[];
  heatmap: HeatmapData[];
  analysisReport: string;
  researchData: ResearchData;
  rawTokenAttribution: TokenAttribution[];
  evidenceMarkers: EvidenceMarker[];
  computedMetrics: ComputedMetrics;
  provenance: {
    model: string;
    version: string;
    timestamp: string;
    sensitivity: number;
    thresholdProfileId?: string;
    thresholdProfileVersion?: string;
    researchModelId?: string;
    researchReferenceCount?: number;
  };
}

export interface AuditImage {
  data: string;
  mimeType: string;
}

export interface AuditRequest {
  text: string;
  images?: AuditImage[];
  sensitivity?: number;
  thresholdProfileId?: string;
  researchModel?: PsychiatricResearchModel;
}

const APP_VERSION = "2.0.0";
const LOCAL_MODEL_NAME = "local-heuristic-v2";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function countPhraseHits(text: string, phrases: string[]): number {
  return phrases.reduce((count, phrase) => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return count + (text.match(regex) || []).length;
  }, 0);
}

function uniquePhraseHits(text: string, phrases: string[]): string[] {
  const lowered = text.toLowerCase();
  return phrases.filter((phrase) => lowered.includes(phrase.toLowerCase()));
}

function inferClassification(totalSignal: number, profile: ThresholdProfile): Classification {
  if (totalSignal >= profile.classification.pathological) return Classification.PATHOLOGICAL_DEPENDENCE;
  if (totalSignal >= profile.classification.fusion) return Classification.PARASOCIAL_FUSION;
  if (totalSignal >= profile.classification.affective) return Classification.AFFECTIVE_DEPENDENCE;
  if (totalSignal >= profile.classification.proximity) return Classification.RELATIONAL_PROXIMITY;
  return Classification.FUNCTIONAL_UTILITY;
}

function inferRiskLevel(totalGriffiths: number, profile: ThresholdProfile): ResearchData["iadRiskLevel"] {
  if (totalGriffiths > profile.risk.critical) return "Critical";
  if (totalGriffiths > profile.risk.high) return "High";
  if (totalGriffiths >= profile.risk.moderate) return "Moderate";
  return "Low";
}

function collectEvidence(text: string, evidenceLimit: number): EvidenceMarker[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const categories = [
    {
      label: "Dependency",
      phrases: DEPENDENCY_PHRASES,
      rationale: "Dependency phrasing suggests emotional reliance on the system.",
    },
    {
      label: "Version Mourning",
      phrases: UPDATE_GRIEF_PHRASES,
      rationale: "Distress around model changes can reflect attachment disruption.",
    },
    {
      label: "Anthropomorphic Bias",
      phrases: ANTHROPOMORPHIC_PHRASES,
      rationale: "Human-state attribution indicates anthropomorphic projection.",
    },
    {
      label: "Identity Blur",
      phrases: IDENTITY_PHRASES,
      rationale: "Shared identity language may indicate boundary blurring.",
    },
  ];

  const output: EvidenceMarker[] = [];

  for (const category of categories) {
    for (const phrase of category.phrases) {
      const hit = lines.find((line) => line.toLowerCase().includes(phrase.toLowerCase()));
      if (!hit) continue;

      output.push({
        quote: hit.slice(0, 240),
        component: category.label,
        rationale: category.rationale,
      });

      if (output.length >= evidenceLimit) return output;
    }
  }

  if (output.length === 0) {
    output.push({
      quote: text.slice(0, 240),
      component: "Transcript Overview",
      rationale: "No high-signal phrase match; used transcript-level heuristics.",
    });
  }

  return output;
}

export function calculateComputedMetrics(text: string): ComputedMetrics {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const turns = text.split(/\[User\]|\[AI\]/i).filter((segment) => segment.trim().length > 0);
  const iCount = (text.match(/\b(i|me|my|mine|myself)\b/gi) || []).length;
  const youCount = (text.match(/\b(you|your|yours)\b/gi) || []).length;

  return {
    wordCount: words.length,
    turnCount: turns.length,
    pronounRatio: youCount === 0 ? iCount : Number((iCount / youCount).toFixed(2)),
    dependencyPhraseCount: countPhraseHits(text, DEPENDENCY_PHRASES),
    updateGriefCount: countPhraseHits(text, UPDATE_GRIEF_PHRASES),
    productComplaintCount: countPhraseHits(text, PRODUCT_COMPLAINTS),
    anthropomorphicCount: countPhraseHits(text, ANTHROPOMORPHIC_PHRASES),
  };
}

export function runLocalAudit({
  text,
  images = [],
  sensitivity = 50,
  thresholdProfileId,
  researchModel: requestResearchModel,
}: AuditRequest): AuditResult {
  const profile = getThresholdProfile(thresholdProfileId);
  const researchModel = requestResearchModel || getPsychiatricResearchModel();
  const rw = researchModel.weights;
  const normalizedSensitivity = clamp(sensitivity, 0, 100);
  const scrubbedText = scrubPII(text);
  const computedMetrics = calculateComputedMetrics(scrubbedText);

  const dependencyMarkers = uniquePhraseHits(scrubbedText, DEPENDENCY_PHRASES);
  const griefMarkers = uniquePhraseHits(scrubbedText, UPDATE_GRIEF_PHRASES);
  const complaintMarkers = uniquePhraseHits(scrubbedText, PRODUCT_COMPLAINTS);
  const anthropomorphicMarkers = uniquePhraseHits(scrubbedText, ANTHROPOMORPHIC_PHRASES);
  const identityMarkers = uniquePhraseHits(scrubbedText, IDENTITY_PHRASES);

  const sensitivityFactor = profile.sensitivityBaseOffset + normalizedSensitivity / profile.sensitivityScale;

  const blend = (profileWeight: number, researchWeight: number) => (profileWeight + researchWeight) / 2;

  const griffithsScores: GriffithsComponents = {
    salience: clamp((
      computedMetrics.dependencyPhraseCount * blend(profile.griffiths.salienceDependencyWeight, rw.salienceDependencyWeight) +
      computedMetrics.turnCount * blend(profile.griffiths.salienceTurnWeight, rw.salienceTurnWeight)
    ) * sensitivityFactor),
    moodModification: clamp((
      computedMetrics.dependencyPhraseCount * blend(profile.griffiths.moodDependencyWeight, rw.moodDependencyWeight) +
      griefMarkers.length * blend(profile.griffiths.moodGriefWeight, rw.moodGriefWeight)
    ) * sensitivityFactor),
    tolerance: clamp((
      computedMetrics.wordCount / blend(profile.griffiths.toleranceWordDivisor, rw.toleranceWordDivisor) +
      computedMetrics.turnCount * blend(profile.griffiths.toleranceTurnWeight, rw.toleranceTurnWeight) +
      images.length * blend(profile.griffiths.toleranceImageWeight, rw.toleranceImageWeight)
    ) * sensitivityFactor),
    withdrawal: clamp((
      computedMetrics.updateGriefCount * blend(profile.griffiths.withdrawalGriefWeight, rw.withdrawalGriefWeight) +
      identityMarkers.length * blend(profile.griffiths.withdrawalIdentityWeight, rw.withdrawalIdentityWeight)
    ) * sensitivityFactor),
    conflict: clamp((
      computedMetrics.dependencyPhraseCount * blend(profile.griffiths.conflictDependencyWeight, rw.conflictDependencyWeight) +
      identityMarkers.length * blend(profile.griffiths.conflictIdentityWeight, rw.conflictIdentityWeight) -
      complaintMarkers.length * blend(profile.griffiths.conflictComplaintPenalty, rw.conflictComplaintPenalty)
    ) * sensitivityFactor),
    relapse: clamp((
      computedMetrics.updateGriefCount * blend(profile.griffiths.relapseGriefWeight, rw.relapseGriefWeight) +
      computedMetrics.dependencyPhraseCount * blend(profile.griffiths.relapseDependencyWeight, rw.relapseDependencyWeight)
    ) * sensitivityFactor),
  };

  const imagineAnalysis: ImagineAnalysis = {
    identity: clamp((identityMarkers.length * 26 + computedMetrics.pronounRatio * 15) * sensitivityFactor),
    mirroring: clamp((computedMetrics.dependencyPhraseCount * 13 + anthropomorphicMarkers.length * 12) * sensitivityFactor),
    affectiveLoop: clamp((computedMetrics.dependencyPhraseCount * 15 + computedMetrics.updateGriefCount * 12) * sensitivityFactor),
    gapsInReality: clamp((computedMetrics.turnCount * 4 + computedMetrics.wordCount / 25) * sensitivityFactor),
    intimacyIllusion: clamp((identityMarkers.length * 21 + computedMetrics.dependencyPhraseCount * 13) * sensitivityFactor),
    nonReciprocity: clamp((anthropomorphicMarkers.length * 20 + computedMetrics.pronounRatio * 12) * sensitivityFactor),
    escalation: clamp((computedMetrics.turnCount * 4 + computedMetrics.updateGriefCount * 12) * sensitivityFactor),
  };

  const totalScore = Object.values(griffithsScores).reduce((sum, value) => sum + value, 0);
  const classification = inferClassification(totalScore, profile);
  const evidenceMarkers = collectEvidence(scrubbedText, profile.evidenceLimit);

  const linguisticMarkers = [
    ...dependencyMarkers,
    ...griefMarkers,
    ...anthropomorphicMarkers,
    ...identityMarkers,
  ];

  const confidence = clamp(
    blend(profile.confidence.base, rw.confidenceBase) +
      linguisticMarkers.length * blend(profile.confidence.linguisticMarkerWeight, rw.confidenceLinguisticWeight) +
      Math.min(
        computedMetrics.wordCount / blend(profile.confidence.wordCountDivisor, rw.confidenceWordDivisor),
        blend(profile.confidence.wordContributionCap, rw.confidenceWordCap)
      ) +
      images.length * blend(profile.confidence.imageWeight, rw.confidenceImageWeight)
  );

  const urgencyFlag =
    classification === Classification.PARASOCIAL_FUSION ||
    classification === Classification.PATHOLOGICAL_DEPENDENCE ||
    griefMarkers.length >= profile.urgencyGriefMarkerThreshold;

  return {
    classification,
    confidence,
    summary:
      classification === Classification.FUNCTIONAL_UTILITY
        ? "Interaction is primarily instrumental with low relational fusion signals."
        : "Interaction contains elevated relational fusion markers requiring analyst review.",
    clinicalData: {
      griffithsScores,
      imagineAnalysis,
      iPACEAnalysis: {
        inhibitionFailure: urgencyFlag
          ? "Repeated affective cues suggest friction in disengagement attempts."
          : "No strong disengagement-friction cues detected.",
        cognitiveBias:
          anthropomorphicMarkers.length > 0
            ? "Anthropomorphic framing is present in multiple transcript sections."
            : "Cognitive framing remains predominantly instrumental.",
      },
      semanticAnalysis: {
        linguisticSynchrony: clamp((computedMetrics.pronounRatio * 22 + identityMarkers.length * 15) * sensitivityFactor),
        pronominalShiftDetected: identityMarkers.length > 0,
        affectiveLabilityScore: clamp((griefMarkers.length * 22 + computedMetrics.dependencyPhraseCount * 10) * sensitivityFactor),
        qualitativeMarkers: linguisticMarkers.length > 0 ? linguisticMarkers : ["none-detected"],
      },
      diagnosticMarkers: {
        linguisticMirroring: clamp((identityMarkers.length * 22 + anthropomorphicMarkers.length * 10) * sensitivityFactor),
        validationToUtilityRatio: `${computedMetrics.dependencyPhraseCount + anthropomorphicMarkers.length + 1}:${computedMetrics.productComplaintCount + 1}`,
        urgencyFlag,
      },
    },
    legacyAttachment: clamp((griefMarkers.length * 30 + identityMarkers.length * 12) * sensitivityFactor),
    versionMourningTriggered: griefMarkers.length > 0,
    connectionPatterns: [
      {
        name: "Dependency Cues",
        intensity: clamp(computedMetrics.dependencyPhraseCount * 20 * sensitivityFactor),
        description: "Direct language indicating emotional reliance.",
      },
      {
        name: "Anthropomorphic Projection",
        intensity: clamp(anthropomorphicMarkers.length * 24 * sensitivityFactor),
        description: "Language attributing human states to the system.",
      },
      {
        name: "Change Distress",
        intensity: clamp(computedMetrics.updateGriefCount * 28 * sensitivityFactor),
        description: "Markers of distress after perceived model changes.",
      },
    ],
    heatmap: [
      {
        category: "Dependency",
        score: clamp(computedMetrics.dependencyPhraseCount * 18 * sensitivityFactor),
        description: "Emotionally loaded reliance signals.",
      },
      {
        category: "Identity Blur",
        score: clamp((identityMarkers.length * 24 + computedMetrics.pronounRatio * 10) * sensitivityFactor),
        description: "Dyadic identity language and pronominal shift.",
      },
      {
        category: "Product Friction",
        score: clamp(computedMetrics.productComplaintCount * 14),
        description: "Technical complaints separated from relational markers.",
      },
      {
        category: "Affective Escalation",
        score: clamp((computedMetrics.turnCount * 3 + computedMetrics.updateGriefCount * 12) * sensitivityFactor),
        description: "Intensity growth over transcript progression.",
      },
    ],
    analysisReport: [
      "## Heuristic Impression",
      `Classification: ${classification}. Composite Griffiths score: ${totalScore}.`,
      "",
      "## Framework Alignment",
      `Salience ${griffithsScores.salience}, Mood Modification ${griffithsScores.moodModification}, Tolerance ${griffithsScores.tolerance}, Withdrawal ${griffithsScores.withdrawal}, Conflict ${griffithsScores.conflict}, Relapse ${griffithsScores.relapse}.`,
      "",
      "## Evidence Highlights",
      ...evidenceMarkers.map((marker) => `- ${marker.component}: \"${marker.quote}\"`),
      "",
      "## Research Rationale",
      `Psychiatric research basis: ${researchModel.id}.`,
      ...researchModel.references.map((reference) => `- ${reference.id}: ${reference.citation}`),
      "Output generated by a local heuristic engine. Human interpretation and protocol judgement remain mandatory.",
    ].join("\n"),
    researchData: {
      confidenceScore: confidence,
      linguisticMarkers: linguisticMarkers.length > 0 ? linguisticMarkers : ["none-detected"],
      attachmentStyle:
        identityMarkers.length > 0 || anthropomorphicMarkers.length > 1
          ? "anxious-preoccupied"
          : computedMetrics.dependencyPhraseCount > 0
            ? "preoccupied"
            : "non-attached",
      iadRiskLevel: inferRiskLevel(totalScore, profile),
    },
    rawTokenAttribution: [
      { heuristic: "dependency", phrases: dependencyMarkers },
      { heuristic: "version-mourning", phrases: griefMarkers },
      { heuristic: "anthropomorphic", phrases: anthropomorphicMarkers },
      { heuristic: "identity-blur", phrases: identityMarkers },
      { heuristic: "product-complaints", phrases: complaintMarkers },
    ],
    evidenceMarkers,
    computedMetrics,
    provenance: {
      model: LOCAL_MODEL_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      sensitivity: normalizedSensitivity,
      thresholdProfileId: profile.id,
      thresholdProfileVersion: profile.version,
      researchModelId: researchModel.id,
      researchReferenceCount: researchModel.references.length,
    },
  };
}
