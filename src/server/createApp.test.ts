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

    const payload = (await response.json()) as { classification: string; confidence: number };

    assert.equal(response.status, 200);
    assert.equal(typeof payload.classification, "string");
    assert.equal(typeof payload.confidence, "number");
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
