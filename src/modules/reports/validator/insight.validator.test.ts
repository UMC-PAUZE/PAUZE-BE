import assert from "node:assert/strict";
import test from "node:test";
import type { InsightCandidate } from "../calculator/insight.types.js";
import { createInsightContent } from "../template/insight-template.service.js";
import { validateInsightContent } from "./insight.validator.js";

const candidate: InsightCandidate = {
  type: "TOP_TRIGGER",
  priority: 2,
  metrics: {
    triggerName: "소음 노출",
    triggerCount: 18,
  },
};

test("accepts template numbers and rejects invented AI numbers", () => {
  assert.equal(
    validateInsightContent(createInsightContent(candidate, "MONTHLY"), candidate),
    true,
  );
  assert.equal(
    validateInsightContent("이번 달 소음 노출이 180회 발생했어요.", candidate),
    false,
  );
});
