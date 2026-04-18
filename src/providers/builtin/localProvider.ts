import { runLocalAudit, type AuditRequest, type AuditResult } from "../../shared/auditCore";
import type { AuditProviderContract } from "../contracts/auditProviderContract";

export class LocalProvider implements AuditProviderContract {
  readonly name = "local";

  async analyze(request: AuditRequest): Promise<AuditResult> {
    return runLocalAudit(request);
  }
}
