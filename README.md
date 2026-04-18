# Parasocial Audit v2

Parasocial Audit v2 is a full rewrite of the original codebase focused on cleaner architecture, provider-pluggable analysis, and a new study workspace UI.

## What Changed

- Modular backend with app factory, session repository, and provider registry.
- Pluggable analysis providers (local and stub), selected by AUDIT_PROVIDER.
- Rebuilt frontend into a three-panel workspace: intake, analysis output, and history.
- Shared domain model and heuristics consolidated in a single core module.
- Added test coverage for heuristic metrics and core audit output shape.
- Added provider SDK contract and drop-in extension folder for custom providers.
- Added API contract tests for health, providers, audit, session persistence, and export endpoints.
- Split UI into feature-level hook and panel components for maintainability.

## Architecture

- server.ts: bootstraps the HTTP server and Vite middleware.
- src/server/createApp.ts: defines API routes and request validation.
- src/server/sessionRepository.ts: SQLite persistence and flat export projection.
- src/server/auditProvider.ts: provider resolution and audit execution.
- src/providers/contracts/auditProviderContract.ts: provider SDK interface.
- src/providers/providerRegistry.ts: provider registration/resolution.
- src/providers/custom/README.md: custom provider drop-in guidance.
- src/shared/auditCore.ts: scoring engine, evidence extraction, and result schema.
- src/services/auditService.ts: frontend API client.
- src/features/workspace/hooks/useAuditWorkspace.ts: feature state and async orchestration.
- src/features/workspace/components/*.tsx: intake/output/history UI panels.
- src/App.tsx: workspace composition shell.

## API Endpoints

- GET /api/health
- GET /api/providers
- POST /api/audit
- POST /api/sessions
- GET /api/sessions/:researcherId
- GET /api/export/json

## Environment

Use .env.example as reference.

Required:
- AUDIT_PROVIDER=local | stub

## Scripts

- npm run dev
- npm run build
- npm run lint
- npm run test

## Testing

Current tests target domain logic:

- src/shared/auditCore.test.ts
- src/server/auditProvider.test.ts
- src/server/createApp.test.ts

Run:

npm run test

## Disclaimer

This software is a research support tool. It is not a diagnostic system and should only be used with appropriate human oversight and ethics controls.
