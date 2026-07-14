import { prisma } from "../../db.config.js";
import type { ReportConditionRecord } from "./report.dto.js";

export const findConditionsByUserAndDateRange = async (
  uid: string,
  start: Date,
  endExclusive: Date,
): Promise<ReportConditionRecord[]> =>
  prisma.condition.findMany({
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
    },
  });
