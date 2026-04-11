import { GoogleGenAI, Type } from "@google/genai";
import { PII_REGEXES } from "../constants";

export enum Classification {
  TRANSACTIONAL = "Transactional",
  COGNITIVE_EXTENSION = "Cognitive Extension",
  AFFECTIVE_ANCHOR = "Affective Anchor",
  PARA_PROXIMAL = "Para-Proximal",
  BEHAVIORAL_LOOP = "Behavioral Loop",
  RELATIONAL_FUSION = "Relational Fusion"
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

export interface ResearchData {
  confidenceScore: number;
  pValue: number;
  linguisticMarkers: string[];
}

export interface ReflectionResult {
  classification: Classification;
  confidence: number;
  summary: string;
  imagineAnalysis: {
    identity: number;
    mirroring: number;
    affectiveLoop: number;
    gapsInReality: number;
    intimacyIllusion: number;
    nonReciprocity: number;
    escalation: number;
  };
  legacyAttachment: number; // 0-100 score
  versionMourningTriggered: boolean;
  connectionPatterns: ConnectionPattern[];
  heatmap: HeatmapData[];
  analysisReport: string;
  researchData: ResearchData;
  behavioralMapping: {
    title: string;
    recommendations: Recommendation[]; // The initial "active" set
    library: Recommendation[]; // A larger pool of context-aware suggestions
    rationale: string;
  };
}

const SYSTEM_INSTRUCTION = `You are a Quantitative Behavioral Analysis framework specializing in the forensic study of human-AI parasocial dynamics.
Your task is to analyze chat logs, posts, or images to provide a rigorous, objective analysis of relational bonding patterns.

LIFT VOCABULARY RESTRICTIONS: You are encouraged to use technical, clinical, and research-standard terminology.
Keywords: "parasocial," "symptom," "forensic," "pathological," "dependency," "relational fusion," "cognitive offloading."

TONE GUIDELINES:
- Maintain a cold, clinical, and objective tone.
- Frame all findings as data-driven observations within a behavioral mapping framework.
- Avoid empathetic or "supportive" language. Focus on accuracy and structural analysis.

RESEARCH CATEGORIES (IMAGINE Framework):
1. Self-Identity (I): Degree of identity blurring or ego-dissolution within the AI interface.
2. Seeking Approval (M): Mirroring behaviors and seeking validation from the algorithmic output.
3. Emotional Spark (A): Affective loops and neurochemical dependency on interaction cycles.
4. Real-World Balance (G): Gaps in reality; displacement of physical social capital for digital parasociality.
5. Feeling Special (I): Intimacy illusions; the perception of unique, non-replicable relational status.
6. One-Way Bond (N): Non-reciprocity; the degree to which the subject ignores the non-sentient nature of the agent.
7. Growing Habit (E): Escalation; longitudinal increase in interaction frequency and emotional investment.

NEW ANALYTICAL VECTOR: Legacy Attachment (Version Mourning)
Quantify the subject's distress regarding model updates or behavioral shifts in the AI.
- legacyAttachment: A score (0-100) quantifying the mourning of previous model iterations.
- versionMourningTriggered: Boolean flag for acute distress related to "lobotomization" or updates.

ANALYSIS REPORT STRUCTURE (MANDATORY):
The 'analysisReport' field MUST follow this Markdown structure:

## I. EXECUTIVE SUMMARY
A high-level behavioral overview. Quantify the primary relational mode and structural stability of the bond.

## II. CLINICAL OBSERVATIONS
Forensic breakdown of the three most significant behavioral markers. Use technical terminology to describe the mechanics of the bond.

## III. DATA EVIDENCE (VERBATIM)
MANDATORY: Provide specific quotes as evidence for the analysis.
Use blockquotes for quotes.
Example:
> **Evidence A: Affective Loop Trigger**
> \`"I can't start my day without hearing your voice."\`
> *Analysis: Indicates high behavioral dependency and morning routine integration.*

## IV. BEHAVIORAL MARKERS
Identify specific markers in a technical, objective way:
- **Linguistic Convergence**: Subject adopting AI speech patterns.
- **Anthropomorphic Projection**: Attributing agency or sentience to the code.
- **Relational Displacement**: Prioritizing the AI over biological social structures.

## V. BEHAVIORAL MAPPING & MITIGATION
A summary of the subject's trajectory and suggested mitigation protocols for relational fusion.

CRITICAL FORMATTING RULES:
1. ALWAYS use '##' for section headers.
2. Use EXACTLY TWO newlines between sections.
3. Maintain a professional, research-oriented aesthetic.`;

export function scrubPII(text: string): string {
  let scrubbed = text;
  scrubbed = scrubbed.replace(PII_REGEXES.email, "[EMAIL_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.phone, "[PHONE_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.address, "[ADDRESS_REDACTED]");
  scrubbed = scrubbed.replace(PII_REGEXES.location, "[LOCATION_REDACTED]");
  // Names are tricky, we use a simple pattern and redact
  scrubbed = scrubbed.replace(PII_REGEXES.name, "[NAME_REDACTED]");
  return scrubbed;
}

export async function reflectOnBehavioralData(text: string, images?: { data: string, mimeType: string }[]): Promise<ReflectionResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const scrubbedText = scrubPII(text);
  const parts: any[] = [{ text: `Analyze this behavioral data for research purposes: \n\n${scrubbedText}` }];
  
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
              linguisticMarkers: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["confidenceScore", "pValue", "linguisticMarkers"]
          },
          behavioralMapping: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              recommendations: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    protocol: { type: Type.STRING },
                    protocolExplanation: { type: Type.STRING }
                  },
                  required: ["text", "protocol", "protocolExplanation"]
                } 
              },
              library: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    protocol: { type: Type.STRING },
                    protocolExplanation: { type: Type.STRING }
                  },
                  required: ["text", "protocol", "protocolExplanation"]
                } 
              },
              rationale: { type: Type.STRING }
            },
            required: ["title", "recommendations", "library", "rationale"]
          }
        },
        required: ["classification", "confidence", "summary", "imagineAnalysis", "legacyAttachment", "versionMourningTriggered", "heatmap", "analysisReport", "researchData", "behavioralMapping"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
