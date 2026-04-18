import assert from "node:assert/strict";
import test from "node:test";
import { Classification, calculateComputedMetrics, runLocalAudit } from "./auditCore";

test("calculateComputedMetrics counts dependency phrases", () => {
  const text = "I need you. Please do not leave me. You are my only friend.";
  const metrics = calculateComputedMetrics(text);

  assert.ok(metrics.wordCount > 0);
  assert.ok(metrics.dependencyPhraseCount >= 2);
});

test("runLocalAudit returns deterministic shape", () => {
  const result = runLocalAudit({
    text: "I need you and I miss the old model, you changed.",
    sensitivity: 60,
  });

  assert.ok(Object.values(Classification).includes(result.classification));
  assert.ok(result.confidence >= 0 && result.confidence <= 100);
  assert.equal(typeof result.analysisReport, "string");
  assert.equal(result.provenance.model, "local-heuristic-v2");
});
