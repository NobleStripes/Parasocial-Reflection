# Interaction Pattern Studio

Interaction Pattern Studio is a full rewrite of the original codebase focused on cleaner architecture, provider-pluggable analysis, and a new study workspace UI.

## Audience Restriction

This application is intended only for psychology researchers and qualified behavioral-health research teams.
It must not be used by untrained users, for self-diagnosis, or as a clinical decision system.
It is not authorized for direct consumer mental-health use.

## What Changed

- Modular backend with app factory, session repository, and provider registry.
- Pluggable analysis providers (local and stub), selected by AUDIT_PROVIDER.
- Rebuilt frontend into a three-panel workspace: intake, analysis output, and history.
- Shared domain model and heuristics consolidated in a single core module.
- Added test coverage for heuristic metrics and core audit output shape.
- Added provider SDK contract and drop-in extension folder for custom providers.
- Added API contract tests for health, providers, audit, session persistence, and export endpoints.
- Split UI into feature-level hook and panel components for maintainability.
- Added threshold profile system (default, conservative, sensitive) with profile-aware provenance.
- Added calibration mode for side-by-side scoring across selected profiles.
- Added psychiatric-research evidence model that now contributes directly to heuristic scoring weights.

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
- GET /api/threshold-profiles
- GET /api/research-basis
- POST /api/pii/scrub
- POST /api/audit
- POST /api/audit/compare
- POST /api/sessions
- GET /api/sessions/:researcherId
- GET /api/export/json

## Diagnostic Thresholds (Implementation Reference)

This section documents the exact thresholds currently used by the local heuristic engine in src/shared/auditCore.ts.

### Input Normalization Thresholds

- sensitivity is clamped to [0, 100].
- sensitivityFactor = 0.7 + (sensitivity / 100), so the effective multiplier range is [0.7, 1.7].
- Most scored outputs are rounded and clamped to [0, 100].

### Classification Thresholds

Classification is inferred from totalScore = sum(Griffiths six component scores):

- totalScore >= 240: Pathological Dependence
- totalScore >= 180 and < 240: Parasocial Fusion
- totalScore >= 120 and < 180: Affective Dependence
- totalScore >= 60 and < 120: Relational Proximity
- totalScore < 60: Functional Utility

### IAD Risk Level Thresholds

IAD risk is inferred from totalGriffiths:

- totalGriffiths > 450: Critical
- totalGriffiths > 300 and <= 450: High
- totalGriffiths >= 150 and <= 300: Moderate
- totalGriffiths < 150: Low

### Urgency Flag Thresholds

urgencyFlag is true when any of the following holds:

- classification is Parasocial Fusion
- classification is Pathological Dependence
- griefMarkers.length > 1

### Version Mourning Threshold

- versionMourningTriggered is true when griefMarkers.length > 0.

### Confidence Score Thresholds

confidence is computed then clamped to [0, 100]:

- formula: 45 + (linguisticMarkers.length * 5) + min(wordCount / 20, 18) + (images.length * 3)
- word-count contribution is capped at 18 points
- baseline confidence before contributions is 45

### Evidence Extraction Thresholds

- Maximum evidence markers returned: 8
- If no category hit is found, a fallback Transcript Overview marker is emitted

### API Validation Thresholds (Server)

From src/server/createApp.ts:

- POST /api/audit requires non-empty text (trimmed). Empty or missing text returns HTTP 400.
- POST /api/audit defaults sensitivity to 50 when omitted or non-numeric.
- POST /api/audit uses images = [] when omitted or invalid.
- POST /api/sessions requires non-empty researcherId (trimmed). Missing researcherId returns HTTP 400.

## Environment

Use .env.example as reference.

Required:
- AUDIT_PROVIDER=local | stub

Security and privacy controls:

- CORS_ALLOWED_ORIGINS
- API_RATE_LIMIT_MAX
- API_RATE_LIMIT_WINDOW_MS
- MAX_TRANSCRIPT_CHARS
- MAX_NOTES_CHARS
- ENABLE_HSTS
- PRIVACY_HASH_RESEARCHER_ID
- PRIVACY_STORE_RAW_DATA
- PRIVACY_PII_SCRUBBER_ENABLED
- RESEARCH_MODEL_ID
- RESEARCH_MODELS_FILE

Runtime transparency endpoints:

- GET /api/privacy-config
- GET /api/research-basis

## Threshold Profiles and Calibration

The local engine now supports profile-driven thresholds:

- default-v2: baseline thresholds matching v2 defaults.
- conservative-v1: higher thresholds to reduce false positives.
- sensitive-v1: lower thresholds to surface early warning patterns.

Each audit stores profile metadata in result provenance:

- thresholdProfileId
- thresholdProfileVersion

Calibration mode compares one transcript against multiple profiles and returns:

- profile identity and version
- classification and risk
- confidence
- salience score
- Griffiths total score

## Psychiatric Research Basis

Heuristic scoring now blends threshold profile coefficients with a psychiatric research evidence model.

Research models are externally configurable via JSON registry:

- config/research-models.json
- schema: { schemaVersion, models[] }
- each model carries references plus scoring weights

Server-side resolution and version pinning:

- registry loader: src/server/researchModelRegistry.ts
- optional model pin: RESEARCH_MODEL_ID
- optional registry path override: RESEARCH_MODELS_FILE

Current evidence model:

- id: psychiatric-evidence-v1
- references include foundational addiction-component and I-PACE research, plus attachment/anthropomorphism review grounding.

The scoring engine uses these research-derived weights for:

- Griffiths component coefficients
- confidence score baseline and scaling terms
- report-level research rationale output

Every audit now exposes research provenance:

- provenance.researchModelId
- provenance.researchReferenceCount

Research basis transparency endpoint:

- GET /api/research-basis returns activeModel, pinnedModelId, and availableModels.

## Scripts

- npm run dev
- npm run build
- npm run lint
- npm run test

## Security and Privacy Measures

The application now enforces a baseline hardening profile:

- HTTP response security headers (CSP, X-Frame-Options, X-Content-Type-Options, referrer policy, permissions policy, cross-origin policies).
- Optional HSTS in production.
- Configurable CORS allowlist.
- In-memory per-IP API rate limiting.
- Transcript size guardrails.
- Note sanitization and max-length enforcement.
- Automated PII redaction for transcript ingestion and stored notes, with per-request finding counts.
- Optional researcher ID hashing at rest.
- Optional data minimization mode for stored session payloads.

PII scrubber API:

- POST /api/pii/scrub accepts { text, appendWarning? } and returns redactedText, findings, and totalMatches.
- POST /api/audit and POST /api/audit/compare now include piiScrubSummary in their response payloads.

Implementation references:

- src/server/security.ts
- src/server/privacy.ts
- src/server/createApp.ts
- src/server/sessionRepository.ts

## Testing

Current tests target domain logic:

- src/shared/auditCore.test.ts
- src/server/auditProvider.test.ts
- src/server/createApp.test.ts

API contract tests now also cover:

- GET /api/threshold-profiles
- POST /api/audit/compare

Run:

npm run test

## Disclaimer

This software is a research support tool. It is not a diagnostic system and should only be used with appropriate human oversight and ethics controls.
