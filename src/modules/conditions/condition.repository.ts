import { prisma } from "../../db.config.js";
import type {
  CreateTodayConditionRequestDto,
  SensitivityLevel,
  TriggerCode,
} from "./condition.dto.js";

interface InsertTodayConditionParams extends CreateTodayConditionRequestDto {
  uid: string;
  sensitivityScore: number;
  sensitivityLevel: SensitivityLevel;
  triggerCodes: TriggerCode[];
  conditionDate: Date;
}

export const findTodayConditionByUserId = async (
  uid: string,
  conditionDate: Date,
) => {
  return prisma.condition.findUnique({
    where: {
      uid_conditionDate: { uid, conditionDate },
    },
    select: { conditionId: true },
  });
};

export const insertTodayCondition = async ({
  uid,
  sleepLevel,
  noiseLevel,
  visualLevel,
  socialLevel,
  energyLevel,
  sensitivityScore,
  sensitivityLevel,
  triggerCodes,
  conditionDate,
}: InsertTodayConditionParams) =>
  prisma.$transaction((tx) =>
    tx.condition.create({
      data: {
        uid,
        sleepLevel,
        noiseLevel,
        visualLevel,
        socialLevel,
        energyLevel,
        sensitivityScore,
        sensitivityLevel,
        triggerCodes,
        conditionDate,
      },
      select: {
        conditionId: true,
        sensitivityScore: true,
        sensitivityLevel: true,
      },
    }),
  );