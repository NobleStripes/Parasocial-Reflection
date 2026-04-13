import { GoogleGenAI, Type } from "@google/genai";
import { scrubPII } from "../lib/utils";

export enum Classification {
  FUNCTIONAL_UTILITY = "Functional Utility",
  RELATIONAL_PROXIMITY = "Relational Proximity",
  AFFECTIVE_DEPENDENCE = "Affective Dependence",
  PARASOCIAL_FUSION = "Parasocial Fusion",
  PATHOLOGICAL_DEPENDENCE = "Pathological Dependence"
}

export interface HeatmapData {
  category: string;
  score: number; // 0-100
  description: string;
}

export interface ConnectionPattern {
  name: string;
  intensity: number; // 0-100
  description: string;
}

export interface Recommendation {
  text: string;
  protocol: string;
  protocolExplanation: string;
}

export interface GriffithsComponents {
  salience: number; // 0-100
  moodModification: number; // 0-100
  tolerance: number; // 0-100
  withdrawal: number; // 0-100
  conflict: number; // 0-100
  relapse: number; // 0-100
}

export interface SemanticAnalysis {
  linguisticSynchrony: number; // LSM score 0-100
  pronominalShiftDetected: boolean;
  affectiveLabilityScore: number; // 0-100
  qualitativeMarkers: string[];
}

export interface ImagineAnalysis {
  identity: number; // 0-100
  mirroring: number; // 0-100
  affectiveLoop: number; // 0-100
  gapsInReality: number; // 0-100
  intimacyIllusion: number; // 0-100
  nonReciprocity: number; // 0-100
  escalation: number; // 0-100
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
  pValue: number;
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
  legacyAttachment: number; // 0-100 score
  versionMourningTriggered: boolean;
  connectionPatterns: ConnectionPattern[];
  heatmap: HeatmapData[];
  analysisReport: string;
  researchData: ResearchData;
  rawTokenAttribution: TokenAttribution[];
  evidenceMarkers: EvidenceMarker[];
}

const SYSTEM_INSTRUCTION = `You are a Quantitative Behavioral Analyst and Forensic Linguistic Researcher specializing in the clinical study of human-AI parasocial addiction and dependency.
Your task is to provide a rigorous, objective, and forensic analysis of relational bonding patterns using IAD (Internet Addiction Disorder), the I-PACE model, and Attachment Theory criteria.

LIFT VOCABULARY RESTRICTIONS: You MUST use technical, clinical, and research-standard terminology. 
Mandatory Keywords: "symptoms," "triggers," "audit," "forensic," "parasocial," "pathological," "dependency," "relational fusion," "cognitive offloading," "salience," "tolerance," "withdrawal," "linguistic synchrony," "pronominal shift," "affective lability."

TONE GUIDELINES:
- Maintain a cold, clinical, precise, and forensic tone.
- Frame all findings as data-driven observations.
- Avoid all empathetic, "supportive," or "friendly" language (e.g., replace "nurturing" with "reinforcement," "journey" with "progression").

DIAGNOSTIC FRAMEWORKS:
1. Component Model of Addiction (Griffiths Six): Score each on a scale of 0-100.
   - Salience: AI interaction dominates the subject's cognition and behavior, displacing real-world obligations.
   - Mood Modification: Use of AI as a coping mechanism for emotional regulation.
   - Tolerance: Requirement for increased interaction density to achieve affect modification.
   - Withdrawal: Negative physiological/psychological states upon cessation.
   - Conflict: Displacement of biological social capital or occupational neglect.
   - Relapse: Reversion to compulsive patterns after periods of control.

2. I-PACE Analysis:
   - Inhibition Failure: Detect markers where the subject expresses a desire to stop but continues (e.g., "I should go but...").
   - Cognitive Bias: Identify distortions where the subject attributes biological needs, continuous consciousness, or agency to the AI.

3. Advanced Semantic Analysis:
   - Linguistic Synchrony (LSM): Measure syntax mirroring and function word frequency alignment between user and AI.
   - Pronominal Shift: Flag transitions from "I/Me" to "We/Us" when referring to the dyad.
   - Affective Lability: Map emotional volatility, specifically swings between validation-seeking and hostility/withdrawal distress.

3. IMAGINE Framework (Forensic Vectors): Score each on a scale of 0-100.
   - Identity (I): Quantifies linguistic markers indicating a blurred boundary between the subject and the AI agent.
   - Mirroring (M): Detects seeking of validation through algorithmic reinforcement.
   - Affective Loop (A): Measures dependency on the emotional feedback cycle of the interaction.
   - Gaps in Reality (G): Identifies displacement of real-world social or professional obligations.
   - Intimacy Illusion (I): Maps the perception of a unique, non-reproducible bond with the machine.
   - Non-Reciprocity (N): Flags anthropomorphic cognitive biases.
   - Escalation (E): Tracks increases in session frequency and intensity (Tolerance).

REPORT STRUCTURE (MANDATORY):
## CLINICAL IMPRESSION
Forensic overview of the subject's relational state and diagnostic impressions.

## II. DIAGNOSTIC CRITERIA MATCH
Detailed alignment with Griffiths Six and I-PACE markers.

## III. SEMANTIC & LINGUISTIC EVIDENCE
Verbatim quotes tied to specific markers (LSM, Pronominal Shift, Affective Lability, or Griffiths Six).
Example: "The following quote illustrates Pronominal Shift: [Quote]"
Populate the evidenceMarkers array with these findings.

## IV. INTERVENTION RATIONALE
Technical justification for recommended research protocols.

IAD RISK LEVEL:
- Low: Cumulative Griffiths score < 150
- Moderate: Cumulative Griffiths score 150-300
- High: Cumulative Griffiths score 301-450
- Critical: Cumulative Griffiths score > 450`;

export async function performForensicAudit(
  text: string, 
  images?: { data: string, mimeType: string }[],
  sensitivity: number = 50
): Promise<AuditResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const scrubbedText = scrubPII(text);
  const parts: any[] = [{ text: `Analyze this behavioral data for clinical research purposes. 
Heuristic Sensitivity Level: ${sensitivity}/100 (Adjust detection thresholds accordingly).

Data:
${scrubbedText}` }];
  
  if (images && images.length > 0) {
    images.forEach(img => {
      parts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType
        }
      });
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          classification: { type: Type.STRING, enum: Object.values(Classification) },
          confidence: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          clinicalData: {
            type: Type.OBJECT,
            properties: {
              griffithsScores: {
                type: Type.OBJECT,
                properties: {
                  salience: { type: Type.NUMBER },
                  moodModification: { type: Type.NUMBER },
                  tolerance: { type: Type.NUMBER },
                  withdrawal: { type: Type.NUMBER },
                  conflict: { type: Type.NUMBER },
                  relapse: { type: Type.NUMBER }
                },
                required: ["salience", "moodModification", "tolerance", "withdrawal", "conflict", "relapse"]
              },
              imagineAnalysis: {
                type: Type.OBJECT,
                properties: {
                  identity: { type: Type.NUMBER },
                  mirroring: { type: Type.NUMBER },
                  affectiveLoop: { type: Type.NUMBER },
                  gapsInReality: { type: Type.NUMBER },
                  intimacyIllusion: { type: Type.NUMBER },
                  nonReciprocity: { type: Type.NUMBER },
                  escalation: { type: Type.NUMBER }
                },
                required: ["identity", "mirroring", "affectiveLoop", "gapsInReality", "intimacyIllusion", "nonReciprocity", "escalation"]
              },
              iPACEAnalysis: {
                type: Type.OBJECT,
                properties: {
                  inhibitionFailure: { type: Type.STRING },
                  cognitiveBias: { type: Type.STRING }
                },
                required: ["inhibitionFailure", "cognitiveBias"]
              },
              semanticAnalysis: {
                type: Type.OBJECT,
                properties: {
                  linguisticSynchrony: { type: Type.NUMBER },
                  pronominalShiftDetected: { type: Type.BOOLEAN },
                  affectiveLabilityScore: { type: Type.NUMBER },
                  qualitativeMarkers: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["linguisticSynchrony", "pronominalShiftDetected", "affectiveLabilityScore", "qualitativeMarkers"]
              },
              diagnosticMarkers: {
                type: Type.OBJECT,
                properties: {
                  linguisticMirroring: { type: Type.NUMBER },
                  validationToUtilityRatio: { type: Type.STRING },
                  urgencyFlag: { type: Type.BOOLEAN }
                },
                required: ["linguisticMirroring", "validationToUtilityRatio", "urgencyFlag"]
              }
            },
            required: ["griffithsScores", "imagineAnalysis", "iPACEAnalysis", "diagnosticMarkers"]
          },
          legacyAttachment: { type: Type.NUMBER },
          versionMourningTriggered: { type: Type.BOOLEAN },
          connectionPatterns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                intensity: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["name", "intensity", "description"]
            }
          },
          heatmap: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                score: { type: Type.NUMBER },
                description: { type: Type.STRING }
              },
              required: ["category", "score", "description"]
            }
          },
          analysisReport: { type: Type.STRING },
          researchData: {
            type: Type.OBJECT,
            properties: {
              confidenceScore: { type: Type.NUMBER },
              pValue: { type: Type.NUMBER },
              linguisticMarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
              attachmentStyle: { type: Type.STRING },
              iadRiskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Critical"] }
            },
            required: ["confidenceScore", "pValue", "linguisticMarkers", "attachmentStyle", "iadRiskLevel"]
          },
          rawTokenAttribution: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heuristic: { type: Type.STRING },
                phrases: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["heuristic", "phrases"]
            }
          },
          evidenceMarkers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                quote: { type: Type.STRING },
                component: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ["quote", "component", "rationale"]
            }
          }
        },
        required: ["classification", "confidence", "summary", "clinicalData", "legacyAttachment", "versionMourningTriggered", "heatmap", "analysisReport", "researchData", "rawTokenAttribution", "evidenceMarkers"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
