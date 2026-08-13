import { prisma } from "../../../db.config.js";
import type {
  CreateTodayConditionRequestDto,
  SensitivityLevel,
  TriggerCode,
} from "../dto/condition.dto.js";

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
  prisma.condition.create({
    data: {
      uid,
      sleepLevel,
      noiseLevel,
      visualLevel,
      socialLevel,
      energyLevel,
      sensitivityScore,
      sensitivityLevel,
      conditionDate,
      conditionTriggers: {
        create: triggerCodes.map((code) => ({
          trigger: { connect: { code } },
        })),
      },
    },
    select: {
      conditionId: true,
      sensitivityScore: true,
      sensitivityLevel: true,
    },
  });

export const findLatestConditionByUserId = async (uid: string) =>
  prisma.condition.findFirst({
    where: { uid },
    orderBy: { conditionDate: "desc" },
    select: {
      conditionId: true,
      conditionDate: true,
      sleepLevel: true,
      noiseLevel: true,
      visualLevel: true,
      socialLevel: true,
      energyLevel: true,
      sensitivityScore: true,
      sensitivityLevel: true,
      conditionTriggers: {
        select: {
          trigger: {
            select: { code: true },
          },
        },
      },
    },
  });

export const aggregateStatsByUser = async (uid: string) =>
  prisma.condition.aggregate({
    where: { uid },
    _count: { _all: true },
    _avg: { sensitivityScore: true },
  });

export const findConditionDatesByUser = async (uid: string) =>
  prisma.condition.findMany({
    where: { uid },
    select: { conditionDate: true },
    orderBy: { conditionDate: "asc" },
  });
