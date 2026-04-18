import type { AuditImage, AuditResult } from "../shared/auditCore";

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
  sensitivity = 50
): Promise<AuditResult> {
  const response = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, images, sensitivity }),
  });

  return parseJsonOrThrow(response) as Promise<AuditResult>;
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
