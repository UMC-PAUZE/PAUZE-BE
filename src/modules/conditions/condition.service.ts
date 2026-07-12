import type {
  CreateTodayConditionRequestDto,
  CreateTodayConditionResponseDto,
  EnergyLevel,
  NoiseLevel,
  SensitivityLevel,
  SleepLevel,
  SocialLevel,
  TriggerCode,
  VisualLevel,
} from "./condition.dto.js";
import {
  findTodayConditionByUserId,
  insertTodayCondition,
} from "./condition.repository.js";

export class ConditionAlreadyExistsError extends Error {
  constructor() {
    super("오늘의 컨디션은 이미 입력되었습니다.");
    this.name = "ConditionAlreadyExistsError";
  }
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const getKstTodayDate = () => {
  const now = new Date();
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);

  return new Date(
    Date.UTC(
      kstNow.getUTCFullYear(),
      kstNow.getUTCMonth(),
      kstNow.getUTCDate(),
    ),
  );
};

const sleepScoreMap: Record<SleepLevel, number> = {
  LESS_THAN_FOUR: 20,
  FOUR_TO_SIX: 12,
  SIX_TO_EIGHT: 5,
  OVER_EIGHT: 2,
};

const noiseScoreMap: Record<NoiseLevel, number> = {
  LOW: 5,
  NORMAL: 8,
  HIGH: 15,
  VERY_HIGH: 20,
};

const visualScoreMap: Record<VisualLevel, number> = {
  LOW: 5,
  NORMAL: 8,
  HIGH: 15,
  VERY_HIGH: 20,
};

const socialScoreMap: Record<SocialLevel, number> = {
  NONE: 3,
  SOME: 8,
  MANY: 15,
  TOO_MUCH: 20,
};

const energyScoreMap: Record<EnergyLevel, number> = {
  HIGH: 3,
  NORMAL: 8,
  LOW: 10,
  VERY_LOW: 15,
};

const calculateSensitivityScore = (
  body: CreateTodayConditionRequestDto,
): number => {
  const score =
    sleepScoreMap[body.sleepLevel] +
    noiseScoreMap[body.noiseLevel] +
    visualScoreMap[body.visualLevel] +
    socialScoreMap[body.socialLevel] +
    energyScoreMap[body.energyLevel];

  return Math.min(score, 100);
};

const calculateSensitivityLevel = (score: number): SensitivityLevel => {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "NORMAL";
  return "LOW";
};

const calculateTriggerCodes = (
  body: CreateTodayConditionRequestDto,
): TriggerCode[] => {
  const triggerCodes: TriggerCode[] = [];

  if (body.sleepLevel === "LESS_THAN_FOUR") {
    triggerCodes.push("SLEEP_DEPRIVATION");
  }

  if (body.noiseLevel === "HIGH" || body.noiseLevel === "VERY_HIGH") {
    triggerCodes.push("NOISE_STIMULATION");
  }

  if (body.visualLevel === "HIGH" || body.visualLevel === "VERY_HIGH") {
    triggerCodes.push("VISUAL_STIMULATION");
  }

  if (body.socialLevel === "MANY" || body.socialLevel === "TOO_MUCH") {
    triggerCodes.push("SOCIAL_STIMULATION");
  }

  if (body.energyLevel === "VERY_LOW") {
    triggerCodes.push("LOW_ENERGY");
  }

  return triggerCodes;
};

export const createTodayCondition = async (
  uId: string,
  body: CreateTodayConditionRequestDto,
): Promise<CreateTodayConditionResponseDto> => {
  const conditionDate = getKstTodayDate();

  const existingCondition = await findTodayConditionByUserId(
    uId,
    conditionDate,
  );

  if (existingCondition) {
    throw new ConditionAlreadyExistsError();
  }

  const sensitivityScore = calculateSensitivityScore(body);
  const sensitivityLevel = calculateSensitivityLevel(sensitivityScore);
  const triggerCodes = calculateTriggerCodes(body);

  let createdCondition;

  try {
    createdCondition = await insertTodayCondition({
      uId,
      sleepLevel: body.sleepLevel,
      noiseLevel: body.noiseLevel,
      visualLevel: body.visualLevel,
      socialLevel: body.socialLevel,
      energyLevel: body.energyLevel,
      sensitivityScore,
      sensitivityLevel,
      triggerCodes,
      conditionDate,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ConditionAlreadyExistsError();
    }

    throw error;
  }

  return {
    conditionId: Number(createdCondition.conditionId),
    sensitivityScore: createdCondition.sensitivityScore,
    sensitivityLevel: createdCondition.sensitivityLevel as SensitivityLevel,
    triggerCodes,
  };
};
