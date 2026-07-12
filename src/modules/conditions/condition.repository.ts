import { prisma } from "../../db.config.js";
import type {
  EnergyLevel,
  NoiseLevel,
  SensitivityLevel,
  SleepLevel,
  TriggerCode,
  SocialLevel,
  VisualLevel,
} from "./condition.dto.js";

interface InsertTodayConditionParams {
  uId: string;
  sleepLevel: SleepLevel;
  noiseLevel: NoiseLevel;
  visualLevel: VisualLevel;
  socialLevel: SocialLevel;
  energyLevel: EnergyLevel;
  sensitivityScore: number;
  sensitivityLevel: SensitivityLevel;
  triggerCodes: TriggerCode[];
  conditionDate: Date;
}

export const findTodayConditionByUserId = async (
  uId: string,
  conditionDate: Date,
) => {
  return await prisma.condition.findUnique({
    where: {
      uid_conditionDate: {
        uid: uId,
        conditionDate,
      },
    },
    select: {
      conditionId: true,
    },
  });
};

export const insertTodayCondition = async ({
  uId,
  sleepLevel,
  noiseLevel,
  visualLevel,
  socialLevel,
  energyLevel,
  sensitivityScore,
  sensitivityLevel,
  triggerCodes,
  conditionDate,
}: InsertTodayConditionParams) => {
  return await prisma.condition.create({
    data: {
      uid: uId,
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
  });
};
