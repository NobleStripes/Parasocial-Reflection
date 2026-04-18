import type { AuditRequest, AuditResult } from "../../shared/auditCore";

export interface AuditProviderContract {
  readonly name: string;
  analyze(request: AuditRequest): Promise<AuditResult>;
}

export interface AuditProviderFactory {
  create(): AuditProviderContract;
}
