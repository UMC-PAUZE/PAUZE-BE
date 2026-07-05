import { prisma } from "../../../db.config.js";
import type {
  EnergyLevel,
  NoiseLevel,
  SensitivityLevel,
  SleepLevel,
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
  conditionDate: Date;
}

export const findTodayConditionByUserId = async (
  uId: string,
  startDate: Date,
  endDate: Date,
) => {
  return await prisma.user_conditions.findFirst({
    where: {
      uid: uId,
      condition_date: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      condition_id: true,
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
  conditionDate,
}: InsertTodayConditionParams) => {
  return await prisma.user_conditions.create({
    data: {
      uid: uId,
      sleep_level: sleepLevel,
      noise_level: noiseLevel,
      visual_level: visualLevel,
      social_level: socialLevel,
      energy_level: energyLevel,
      sensitivity_score: sensitivityScore,
      sensitivity_level: sensitivityLevel,
      condition_date: conditionDate,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: {
      condition_id: true,
      sensitivity_score: true,
      sensitivity_level: true,
    },
  });
};
