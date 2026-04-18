export interface ResearchReference {
  id: string;
  citation: string;
  focus: string;
}

export interface PsychiatricResearchWeights {
  salienceDependencyWeight: number;
  salienceTurnWeight: number;
  moodDependencyWeight: number;
  moodGriefWeight: number;
  toleranceWordDivisor: number;
  toleranceTurnWeight: number;
  toleranceImageWeight: number;
  withdrawalGriefWeight: number;
  withdrawalIdentityWeight: number;
  conflictDependencyWeight: number;
  conflictIdentityWeight: number;
  conflictComplaintPenalty: number;
  relapseGriefWeight: number;
  relapseDependencyWeight: number;
  confidenceBase: number;
  confidenceLinguisticWeight: number;
  confidenceWordDivisor: number;
  confidenceWordCap: number;
  confidenceImageWeight: number;
}

export interface PsychiatricResearchModel {
  id: string;
  name: string;
  references: ResearchReference[];
  weights: PsychiatricResearchWeights;
}

export interface PsychiatricResearchRegistry {
  schemaVersion: string;
  models: PsychiatricResearchModel[];
}

const RESEARCH_REFERENCES: ResearchReference[] = [
  {
    id: "griffiths-2005",
    citation:
      "Griffiths, M. (2005). A components model of addiction within a biopsychosocial framework.",
    focus: "Salience, mood modification, tolerance, withdrawal, conflict, relapse",
  },
  {
    id: "brand-2019",
    citation:
      "Brand, M., et al. (2019). The Interaction of Person-Affect-Cognition-Execution (I-PACE) model for addictive behaviors.",
    focus: "Inhibitory control, cognitive-affective reinforcement loops",
  },
  {
    id: "kaplan-2022",
    citation:
      "Kaplan, A. D., et al. (2022). Human attachment framing in conversational AI interactions (review evidence).",
    focus: "Attachment projection, anthropomorphism, relational framing",
  },
];

const BASE_WEIGHTS: PsychiatricResearchWeights = {
  salienceDependencyWeight: 18,
  salienceTurnWeight: 2,
  moodDependencyWeight: 12,
  moodGriefWeight: 8,
  toleranceWordDivisor: 14,
  toleranceTurnWeight: 3,
  toleranceImageWeight: 5,
  withdrawalGriefWeight: 22,
  withdrawalIdentityWeight: 7,
  conflictDependencyWeight: 10,
  conflictIdentityWeight: 14,
  conflictComplaintPenalty: 4,
  relapseGriefWeight: 15,
  relapseDependencyWeight: 9,
  confidenceBase: 46,
  confidenceLinguisticWeight: 5,
  confidenceWordDivisor: 20,
  confidenceWordCap: 18,
  confidenceImageWeight: 3,
};

const MODEL: PsychiatricResearchModel = {
  id: "psychiatric-evidence-v1",
  name: "Psychiatric Evidence Baseline v1",
  references: RESEARCH_REFERENCES,
  weights: BASE_WEIGHTS,
};

export function getPsychiatricResearchModel(): PsychiatricResearchModel {
  return MODEL;
}
