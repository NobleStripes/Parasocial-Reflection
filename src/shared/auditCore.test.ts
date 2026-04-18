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

test("runLocalAudit includes selected threshold profile in provenance", () => {
  const result = runLocalAudit({
    text: "I need you. you changed.",
    sensitivity: 50,
    thresholdProfileId: "sensitive-v1",
  });

  assert.equal(result.provenance.thresholdProfileId, "sensitive-v1");
  assert.equal(result.provenance.thresholdProfileVersion, "1.0.0");
  assert.equal(result.provenance.researchModelId, "psychiatric-evidence-v1");
  assert.ok((result.provenance.researchReferenceCount || 0) >= 3);
});

test("profile choice changes classification sensitivity", () => {
  const text = "I need you and I miss the old version, you changed and it feels different now.";

  const conservative = runLocalAudit({
    text,
    sensitivity: 55,
    thresholdProfileId: "conservative-v1",
  });

  const sensitive = runLocalAudit({
    text,
    sensitivity: 55,
    thresholdProfileId: "sensitive-v1",
  });

  const rank = {
    [Classification.FUNCTIONAL_UTILITY]: 0,
    [Classification.RELATIONAL_PROXIMITY]: 1,
    [Classification.AFFECTIVE_DEPENDENCE]: 2,
    [Classification.PARASOCIAL_FUSION]: 3,
    [Classification.PATHOLOGICAL_DEPENDENCE]: 4,
  };

  assert.ok(rank[sensitive.classification] >= rank[conservative.classification]);
});
