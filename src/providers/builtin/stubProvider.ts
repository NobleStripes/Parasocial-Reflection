import { runLocalAudit, type AuditRequest, type AuditResult } from "../../shared/auditCore";
import type { AuditProviderContract } from "../contracts/auditProviderContract";

export class StubProvider implements AuditProviderContract {
  readonly name = "stub";

  async analyze(request: AuditRequest): Promise<AuditResult> {
    return runLocalAudit({
      ...request,
      text: `${request.text}\n\n[stub-provider-mode]`,
    });
  }
}
