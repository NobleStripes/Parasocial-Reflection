# Custom Providers

Drop custom provider implementations in this folder and register them in src/providers/providerRegistry.ts.

Requirements:
- Implement AuditProviderContract from src/providers/contracts/auditProviderContract.ts
- Expose a stable provider name
- Return the shared AuditResult schema
