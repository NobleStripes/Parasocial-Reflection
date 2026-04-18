import type { AuditRequest, AuditResult } from "../shared/auditCore";
import { analyzeWithProvider, listProviderNames, resolveProvider } from "../providers/providerRegistry";

export async function performAuditAnalysis(request: AuditRequest): Promise<AuditResult> {
  return analyzeWithProvider(request);
}

export function getProviderName(): string {
  return resolveProvider().name;
}

export function getSupportedProviderNames(): string[] {
  return listProviderNames();
}
