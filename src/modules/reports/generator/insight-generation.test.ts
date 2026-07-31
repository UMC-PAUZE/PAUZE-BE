import assert from "node:assert/strict";
import test from "node:test";
import type { InsightCandidate } from "../calculator/insight.types.js";
import { validateAiInsightContent } from "../validator/insight.validator.js";
import { createInsightCalculationHash } from "./insight-hash.util.js";
import { generateInsightContent } from "./insight-content.generator.js";
import { createReportSourceHash } from "./report-source-hash.util.js";

const candidate: InsightCandidate = {
  type: "SLEEP_CORRELATION",
  priority: 3,
  metrics: { differencePercent: 18 },
};

test("creates a stable hash regardless of metric key order", () => {
  const left: InsightCandidate = {
    ...candidate,
    metrics: { differencePercent: 18, group: "수면 충분" },
  };
  const right: InsightCandidate = {
    ...candidate,
    metrics: { group: "수면 충분", differencePercent: 18 },
  };

  assert.equal(
    createInsightCalculationHash(left, "WEEKLY", "v1", "model-a"),
    createInsightCalculationHash(right, "WEEKLY", "v1", "model-a"),
  );
  assert.notEqual(
    createInsightCalculationHash(left, "WEEKLY", "v1", "model-a"),
    createInsightCalculationHash(left, "WEEKLY", "v2", "model-a"),
  );
  assert.notEqual(
    createInsightCalculationHash(left, "WEEKLY", "v1", "model-a"),
    createInsightCalculationHash(left, "WEEKLY", "v1", "model-b"),
  );
});

test("accepts a safe rewrite with exactly the template numbers", () => {
  const template =
    "수면이 충분했던 날은 수면이 부족했던 날보다 예민함이 평균 18% 낮았어요.";
  assert.equal(
    validateAiInsightContent(
      "수면이 충분했던 날에는 예민함이 평균 18% 낮게 나타났어요.",
      candidate,
      template,
    ),
    true,
  );
});

test("rejects invented, omitted, forbidden, or overly long content", () => {
  const template = "수면에 따라 예민함이 평균 18% 달랐어요.";
  assert.equal(
    validateAiInsightContent(
      "수면에 따라 예민함이 평균 18% 달랐고 7일간 이어졌어요.",
      candidate,
      template,
    ),
    false,
  );
  assert.equal(
    validateAiInsightContent("수면에 따라 예민함이 달랐어요.", candidate, template),
    false,
  );
  assert.equal(
    validateAiInsightContent(
      "수면 문제는 심각한 질환이며 예민함이 평균 18% 달랐어요.",
      candidate,
      template,
    ),
    false,
  );
  assert.equal(
    validateAiInsightContent(
      "예민함이 평균 18% 달랐어요. 하루 정도 쉬어보세요.",
      candidate,
      template,
    ),
    false,
  );
  assert.equal(
    validateAiInsightContent(`예민함이 18% 달랐어요. ${"가".repeat(100)}`, candidate, template),
    false,
  );
});

test("uses a template without calling Gemini when AI is disabled", async () => {
  const previousEnabled = process.env.GEMINI_INSIGHT_ENABLED;
  process.env.GEMINI_INSIGHT_ENABLED = "false";
  try {
    const result = await generateInsightContent(candidate, "WEEKLY");
    assert.equal(result.generationSource, "TEMPLATE");
    assert.equal(result.generationError, "AI_DISABLED");
    assert.ok(result.content.length > 0);
  } finally {
    if (previousEnabled === undefined) delete process.env.GEMINI_INSIGHT_ENABLED;
    else process.env.GEMINI_INSIGHT_ENABLED = previousEnabled;
  }
});

test("creates a stable source hash and changes it when usage data changes", () => {
  const records = [
    {
      conditionDate: new Date("2026-08-01T00:00:00.000Z"),
      sensitivityScore: 40,
      triggerCodes: ["NOISE_EXPOSURE" as const],
      sleepLevel: "OVER_8" as const,
      noiseLevel: "UNCOMFORTABLE" as const,
      visualLevel: "LOW" as const,
      socialLevel: "ALONE" as const,
      energyLevel: "ENOUGH" as const,
    },
  ];
  assert.equal(
    createReportSourceHash(records, []),
    createReportSourceHash(records, []),
  );
  assert.notEqual(
    createReportSourceHash(records, []),
    createReportSourceHash(records, [new Date("2026-08-01T01:00:00.000Z")]),
  );
});
