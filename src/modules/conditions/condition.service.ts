import { AppError } from "../../common/errors/app.error.js";
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

export class ConditionAlreadyExistsError extends AppError {
  constructor() {
    super({
      code: "CONDITION_ALREADY_EXISTS",
      message: "오늘의 컨디션은 이미 입력되었습니다.",
      statusCode: 409,
      result: [],
    });
  }
}

class ConditionCreateFailedError extends AppError {
  constructor() {
    super({
      code: "CONDITION_CREATE_FAILED",
      message: "오늘의 컨디션 입력에 실패했습니다.",
      statusCode: 500,
      result: [],
    });
  }
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const getKstTodayDate = (now = new Date()): Date => {
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
  OVER_8: 0,
  SIX_TO_EIGHT: 7,
  FOUR_TO_SIX: 13,
  LESS_4: 20,
};
const noiseScoreMap: Record<NoiseLevel, number> = {
  QUIET: 0,
  NORMAL: 7,
  UNCOMFORTABLE: 13,
  HARD: 20,
};
const visualScoreMap: Record<VisualLevel, number> = {
  LOW: 0,
  NORMAL: 7,
  HIGH: 13,
  VERY_HIGH: 20,
};
const socialScoreMap: Record<SocialLevel, number> = {
  MANY: 0,
  SOME: 7,
  LITTLE: 13,
  ALONE: 20,
};
const energyScoreMap: Record<EnergyLevel, number> = {
  ENOUGH: 0,
  NORMAL: 7,
  LOW: 13,
  NONE: 20,
};

export const calculateSensitivityLevel = (score: number): SensitivityLevel => {
  if (score <= 40) return "LOW";
  if (score <= 65) return "NORMAL";
  return "HIGH";
};

export const calculateCondition = (body: CreateTodayConditionRequestDto) => {
  const scores = {
    sleep: sleepScoreMap[body.sleepLevel],
    noise: noiseScoreMap[body.noiseLevel],
    visual: visualScoreMap[body.visualLevel],
    social: socialScoreMap[body.socialLevel],
    energy: energyScoreMap[body.energyLevel],
  };
  const sensitivityScore = Object.values(scores).reduce(
    (total, score) => total + score,
    0,
  );
  const triggerCodes: TriggerCode[] = [];
  if (scores.sleep >= 13) triggerCodes.push("SLEEP_DEPRIVATION");
  if (scores.noise >= 13) triggerCodes.push("NOISE_EXPOSURE");
  if (scores.visual >= 13) triggerCodes.push("VISUAL_STIMULATION");
  if (scores.social >= 13) triggerCodes.push("SOCIAL_ISOLATION");
  if (scores.energy >= 13) triggerCodes.push("LOW_ENERGY");

  return {
    sensitivityScore,
    sensitivityLevel: calculateSensitivityLevel(sensitivityScore),
    triggerCodes,
  };
};

export const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "P2002";

export const createTodayCondition = async (
  uid: string,
  body: CreateTodayConditionRequestDto,
): Promise<CreateTodayConditionResponseDto> => {
  const conditionDate = getKstTodayDate();

  try {
    if (await findTodayConditionByUserId(uid, conditionDate)) {
      throw new ConditionAlreadyExistsError();
    }

    const calculated = calculateCondition(body);
    const created = await insertTodayCondition({
      uid,
      ...body,
      ...calculated,
      conditionDate,
    });

    return {
      conditionId: Number(created.conditionId),
      sensitivityScore: created.sensitivityScore,
      sensitivityLevel: created.sensitivityLevel,
      triggerCodes: calculated.triggerCodes,
    };
  } catch (error) {
    if (error instanceof ConditionAlreadyExistsError || isUniqueConstraintError(error)) {
      throw new ConditionAlreadyExistsError();
    }
    throw new ConditionCreateFailedError();
  }
};