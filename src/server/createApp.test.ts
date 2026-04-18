import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

import type { Express } from "express";

import { createApp } from "./createApp";

function createFakeSessionStore() {
  const rows: Array<{
    id: number;
    researcherId: string;
    dependencyScore: number;
    data: Record<string, any>;
    notes: string;
    timestamp: string;
  }> = [];

  return {
    create(input: { researcherId: string; dependencyScore: number; data: unknown; notes?: string }) {
      const id = rows.length + 1;
      const previous = [...rows].reverse().find((row) => row.researcherId === input.researcherId);
      const delta = previous ? input.dependencyScore - previous.dependencyScore : 0;

      rows.push({
        id,
        researcherId: input.researcherId,
        dependencyScore: input.dependencyScore,
        data: input.data as Record<string, any>,
        notes: input.notes || "",
        timestamp: new Date().toISOString(),
      });

      return { id, delta };
    },
    listByResearcher(researcherId: string) {
      return rows.filter((row) => row.researcherId === researcherId);
    },
    listAllFlat() {
      return rows.map((row) => ({
        sessionId: row.id,
        researcherId: row.researcherId,
        dependencyScore: row.dependencyScore,
        timestamp: row.timestamp,
        notes: row.notes,
      }));
    },
  };
}

async function withServer(app: Express, run: (baseUrl: string) => Promise<void>) {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test("GET /api/health returns status and provider", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const payload = (await response.json()) as { status: string; provider: string };

    assert.equal(response.status, 200);
    assert.equal(payload.status, "ok");
    assert.ok(payload.provider.length > 0);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
  });
});

test("GET /api/providers returns provider list", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/providers`);
    const payload = (await response.json()) as { providers: string[] };

    assert.equal(response.status, 200);
    assert.ok(payload.providers.includes("local"));
    assert.ok(payload.providers.includes("stub"));
  });
});

test("POST /api/pii/scrub redacts common PII entities", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/pii/scrub`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Contact Dr. Jane Doe at jane@example.com or 212-555-0199.",
      }),
    });

    const payload = (await response.json()) as {
      redactedText: string;
      totalMatches: number;
      findings: Array<{ type: string }>;
    };

    assert.equal(response.status, 200);
    assert.ok(payload.redactedText.includes("[EMAIL_REDACTED]"));
    assert.ok(payload.redactedText.includes("[PHONE_REDACTED]"));
    assert.ok(payload.redactedText.includes("[NAME_REDACTED]"));
    assert.ok(payload.totalMatches >= 3);
    assert.ok(payload.findings.some((entry) => entry.type === "email"));
  });
});

test("GET /api/threshold-profiles returns profile list", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/threshold-profiles`);
    const payload = (await response.json()) as { profiles: Array<{ id: string }> };

    assert.equal(response.status, 200);
    assert.ok(payload.profiles.length >= 3);
    assert.ok(payload.profiles.some((profile) => profile.id === "default-v2"));
  });
});

test("GET /api/research-basis returns psychiatric research model", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/research-basis`);
    const payload = (await response.json()) as {
      activeModel: { id: string; references: Array<{ id: string }> };
      pinnedModelId: string | null;
      availableModels: Array<{ id: string; referenceCount: number }>;
    };

    assert.equal(response.status, 200);
    assert.equal(payload.activeModel.id, "psychiatric-evidence-v1");
    assert.ok(payload.activeModel.references.length >= 3);
    assert.equal(payload.pinnedModelId, null);
    assert.ok(payload.availableModels.length >= 2);
    assert.ok(payload.availableModels.some((model) => model.id === "psychiatric-evidence-v1"));
  });
});

test("GET /api/research-basis honors RESEARCH_MODEL_ID pinning", async () => {
  const previous = process.env.RESEARCH_MODEL_ID;
  process.env.RESEARCH_MODEL_ID = "psychiatric-evidence-v1-strict";

  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/research-basis`);
    const payload = (await response.json()) as {
      activeModel: { id: string };
      pinnedModelId: string | null;
    };

    assert.equal(response.status, 200);
    assert.equal(payload.activeModel.id, "psychiatric-evidence-v1-strict");
    assert.equal(payload.pinnedModelId, "psychiatric-evidence-v1-strict");
  });

  if (previous) {
    process.env.RESEARCH_MODEL_ID = previous;
  } else {
    delete process.env.RESEARCH_MODEL_ID;
  }
});

test("GET /api/privacy-config returns active privacy and security settings", async () => {
  const previousPrivacy = process.env.PRIVACY_HASH_RESEARCHER_ID;
  const previousMaxNotes = process.env.MAX_NOTES_CHARS;
  const previousMaxText = process.env.MAX_TRANSCRIPT_CHARS;

  process.env.PRIVACY_HASH_RESEARCHER_ID = "true";
  process.env.MAX_NOTES_CHARS = "1234";
  process.env.MAX_TRANSCRIPT_CHARS = "4321";

  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/privacy-config`);
    const payload = (await response.json()) as {
      privacyConfig: { hashResearcherId: boolean; maxNotesChars: number };
      securityConfig: { maxTranscriptChars: number };
    };

    assert.equal(response.status, 200);
    assert.equal(payload.privacyConfig.hashResearcherId, true);
    assert.equal(payload.privacyConfig.maxNotesChars, 1234);
    assert.equal(payload.securityConfig.maxTranscriptChars, 4321);
  });

  if (previousPrivacy) process.env.PRIVACY_HASH_RESEARCHER_ID = previousPrivacy;
  else delete process.env.PRIVACY_HASH_RESEARCHER_ID;

  if (previousMaxNotes) process.env.MAX_NOTES_CHARS = previousMaxNotes;
  else delete process.env.MAX_NOTES_CHARS;

  if (previousMaxText) process.env.MAX_TRANSCRIPT_CHARS = previousMaxText;
  else delete process.env.MAX_TRANSCRIPT_CHARS;
});

test("POST /api/audit rejects transcript over max length", async () => {
  const previous = process.env.MAX_TRANSCRIPT_CHARS;
  process.env.MAX_TRANSCRIPT_CHARS = "5";

  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "123456789" }),
    });

    assert.equal(response.status, 400);
  });

  if (previous) process.env.MAX_TRANSCRIPT_CHARS = previous;
  else delete process.env.MAX_TRANSCRIPT_CHARS;
});

test("rate limiter blocks burst traffic beyond configured max", async () => {
  const previousMax = process.env.API_RATE_LIMIT_MAX;
  const previousWindow = process.env.API_RATE_LIMIT_WINDOW_MS;
  process.env.API_RATE_LIMIT_MAX = "2";
  process.env.API_RATE_LIMIT_WINDOW_MS = "60000";

  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const one = await fetch(`${baseUrl}/api/health`);
    const two = await fetch(`${baseUrl}/api/health`);
    const three = await fetch(`${baseUrl}/api/health`);

    assert.equal(one.status, 200);
    assert.equal(two.status, 200);
    assert.equal(three.status, 429);
  });

  if (previousMax) process.env.API_RATE_LIMIT_MAX = previousMax;
  else delete process.env.API_RATE_LIMIT_MAX;

  if (previousWindow) process.env.API_RATE_LIMIT_WINDOW_MS = previousWindow;
  else delete process.env.API_RATE_LIMIT_WINDOW_MS;
});

test("POST /api/audit validates missing text", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });

    assert.equal(response.status, 400);
  });
});

test("POST /api/audit returns audit result", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "I miss how you used to respond. You changed.",
        sensitivity: 55,
      }),
    });

    const payload = (await response.json()) as {
      classification: string;
      confidence: number;
      piiScrubSummary: { totalMatches: number };
    };

    assert.equal(response.status, 200);
    assert.equal(typeof payload.classification, "string");
    assert.equal(typeof payload.confidence, "number");
    assert.equal(typeof payload.piiScrubSummary.totalMatches, "number");
  });
});

test("POST /api/audit scrubs PII before analysis", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Email me at clinician@university.edu and call 617-555-0134.",
      }),
    });

    const payload = (await response.json()) as {
      piiScrubSummary: { findings: Array<{ type: string }>; totalMatches: number };
    };

    assert.equal(response.status, 200);
    assert.ok(payload.piiScrubSummary.totalMatches >= 2);
    assert.ok(payload.piiScrubSummary.findings.some((entry) => entry.type === "email"));
  });
});

test("POST /api/audit/compare returns side-by-side profile comparisons", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/audit/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "I need you and I miss the old behavior.",
        profileIds: ["default-v2", "sensitive-v1"],
      }),
    });

    const payload = (await response.json()) as { comparisons: Array<{ profileId: string }> };

    assert.equal(response.status, 200);
    assert.equal(payload.comparisons.length, 2);
    assert.ok(payload.comparisons.some((row) => row.profileId === "default-v2"));
    assert.ok(payload.comparisons.some((row) => row.profileId === "sensitive-v1"));
  });
});

test("sessions lifecycle: create, list, export", async () => {
  const app = createApp({ sessionRepository: createFakeSessionStore() });

  await withServer(app, async (baseUrl) => {
    const audit = await fetch(`${baseUrl}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "I need you to keep talking to me." }),
    });
    const result = await audit.json();

    const save = await fetch(`${baseUrl}/api/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        researcherId: "r-1",
        dependencyScore: 42,
        data: result,
        notes: "first session",
      }),
    });
    assert.equal(save.status, 200);

    const list = await fetch(`${baseUrl}/api/sessions/r-1`);
    const sessions = (await list.json()) as Array<{ researcherId: string }>;
    assert.equal(list.status, 200);
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].researcherId, "r-1");

    const exported = await fetch(`${baseUrl}/api/export/json`);
    const rows = (await exported.json()) as Array<{ researcherId: string }>;
    assert.equal(exported.status, 200);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].researcherId, "r-1");
  });
});
