import assert from "node:assert/strict";
import test from "node:test";

import { performAuditAnalysis } from "./auditProvider";

test("audit provider resolves local provider by default", async () => {
  const previous = process.env.AUDIT_PROVIDER;
  delete process.env.AUDIT_PROVIDER;

  const result = await performAuditAnalysis({
    text: "I need you and I miss the old responses.",
    sensitivity: 55,
  });

  assert.equal(result.provenance.model, "local-heuristic-v2");

  if (previous) {
    process.env.AUDIT_PROVIDER = previous;
  }
});

test("audit provider supports stub mode", async () => {
  const previous = process.env.AUDIT_PROVIDER;
  process.env.AUDIT_PROVIDER = "stub";

  const result = await performAuditAnalysis({
    text: "Our relationship feels different after updates.",
    sensitivity: 40,
  });

  assert.equal(result.provenance.model, "local-heuristic-v2");
  assert.ok(result.analysisReport.includes("Heuristic Impression"));

  if (previous) {
    process.env.AUDIT_PROVIDER = previous;
  } else {
    delete process.env.AUDIT_PROVIDER;
  }
});
