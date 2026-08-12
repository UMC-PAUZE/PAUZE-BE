import { createHash } from "node:crypto";
import type { ReportConditionRecord } from "../dto/report.dto.js";

export const createReportSourceHash = (
  conditions: readonly ReportConditionRecord[],
  usages: readonly Date[],
): string =>
  createHash("sha256")
    .update(
      JSON.stringify({
        conditions: conditions.map((condition) => ({
          conditionDate: condition.conditionDate.toISOString(),
          sensitivityScore: condition.sensitivityScore,
          sleepLevel: condition.sleepLevel,
          noiseLevel: condition.noiseLevel,
          visualLevel: condition.visualLevel,
          socialLevel: condition.socialLevel,
          energyLevel: condition.energyLevel,
          triggerCodes: [...condition.triggerCodes].sort(),
        })),
        usages: usages.map((usage) => usage.toISOString()).sort(),
      }),
    )
    .digest("hex");
