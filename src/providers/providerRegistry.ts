import type { AuditRequest, AuditResult } from "../shared/auditCore";
import type { AuditProviderContract } from "./contracts/auditProviderContract";
import { LocalProvider } from "./builtin/localProvider";
import { StubProvider } from "./builtin/stubProvider";

const providers: Record<string, AuditProviderContract> = {
  local: new LocalProvider(),
  stub: new StubProvider(),
};

export function listProviderNames(): string[] {
  return Object.keys(providers);
}

export function resolveProvider(name?: string): AuditProviderContract {
  const selected = (name || process.env.AUDIT_PROVIDER || "local").toLowerCase();
  return providers[selected] || providers.local;
}

export async function analyzeWithProvider(request: AuditRequest): Promise<AuditResult> {
  return resolveProvider().analyze(request);
}
