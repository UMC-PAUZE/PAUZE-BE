import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCondition,
  calculateSensitivityLevel,
  getKstTodayDate,
  isUniqueConstraintError,
} from "./condition.service.js";

test("uses the Asia/Seoul date across the UTC midnight boundary", () => {
  assert.equal(
    getKstTodayDate(new Date("2026-07-20T14:59:59.999Z")).toISOString(),
    "2026-07-20T00:00:00.000Z",
  );
  assert.equal(
    getKstTodayDate(new Date("2026-07-20T15:00:00.000Z")).toISOString(),
    "2026-07-21T00:00:00.000Z",
  );
});

test("calculates the documented 53-point example", () => {
  const result = calculateCondition({
    sleepLevel: "FOUR_TO_SIX",
    noiseLevel: "NORMAL",
    visualLevel: "HIGH",
    socialLevel: "SOME",
    energyLevel: "LOW",
  });

  assert.deepEqual(result, {
    sensitivityScore: 53,
    sensitivityLevel: "NORMAL",
    triggerCodes: [
      "SLEEP_DEPRIVATION",
      "VISUAL_STIMULATION",
      "LOW_ENERGY",
    ],
  });
});

test("calculates minimum and maximum valid scores", () => {
  assert.equal(
    calculateCondition({
      sleepLevel: "OVER_8",
      noiseLevel: "QUIET",
      visualLevel: "LOW",
      socialLevel: "MANY",
      energyLevel: "ENOUGH",
    }).sensitivityScore,
    0,
  );
  assert.equal(
    calculateCondition({
      sleepLevel: "LESS_4",
      noiseLevel: "HARD",
      visualLevel: "VERY_HIGH",
      socialLevel: "ALONE",
      energyLevel: "NONE",
    }).sensitivityScore,
    100,
  );
});

test("uses the specified sensitivity boundaries", () => {
  assert.equal(calculateSensitivityLevel(40), "LOW");
  assert.equal(calculateSensitivityLevel(41), "NORMAL");
  assert.equal(calculateSensitivityLevel(65), "NORMAL");
  assert.equal(calculateSensitivityLevel(66), "HIGH");
});

test("recognizes duplicate-condition database errors", () => {
  assert.equal(isUniqueConstraintError({ code: "P2002" }), true);
  assert.equal(isUniqueConstraintError({ code: "P2025" }), false);
});

test("counts 13 and 20 point answers as triggers but not 0 and 7", () => {
  assert.deepEqual(
    calculateCondition({
      sleepLevel: "OVER_8",
      noiseLevel: "NORMAL",
      visualLevel: "HIGH",
      socialLevel: "ALONE",
      energyLevel: "ENOUGH",
    }).triggerCodes,
    ["VISUAL_STIMULATION", "SOCIAL_ISOLATION"],
  );
});
