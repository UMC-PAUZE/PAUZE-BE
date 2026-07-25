import { prisma } from "../../../db.config.js";
import type { ReportConditionRecord } from "../dto/report.dto.js";

export const findConditionsByUserAndDateRange = async (
  uid: string,
  start: Date,
  endExclusive: Date,
): Promise<ReportConditionRecord[]> => {
  const conditions = await prisma.condition.findMany({
    where: {
      uid,
      conditionDate: {
        gte: start,
        lt: endExclusive,
      },
    },
    orderBy: { conditionDate: "asc" },
    select: {
      conditionDate: true,
      sensitivityScore: true,
      sleepLevel: true,
      noiseLevel: true,
      visualLevel: true,
      socialLevel: true,
      energyLevel: true,
      conditionTriggers: {
        select: {
          trigger: { select: { code: true } },
        },
      },
    },
  });

  return conditions.map(({ conditionTriggers, ...condition }) => ({
    ...condition,
    triggerCodes: conditionTriggers.map(({ trigger }) => trigger.code) as ReportConditionRecord["triggerCodes"],
  }));
};
