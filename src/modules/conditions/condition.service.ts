import { AppError } from "../../common/errors/app.error.js";
import type {
  CreateTodayConditionRequestDto,
  CreateTodayConditionResponseDto,
  SensitivityLevel,
  TriggerCode,
} from "./condition.dto.js";
import {
  CONDITION_SCORE_POLICY,
  CONDITION_TRIGGER_THRESHOLD,
  getSensitivityLevel,
} from "./condition.policy.js";
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

const KST_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const getKstTodayDate = (now = new Date()): Date => {
  const dateParts = Object.fromEntries(
    KST_DATE_FORMATTER.formatToParts(now).map(({ type, value }) => [type, value]),
  );

  return new Date(Date.UTC(
    Number(dateParts.year),
    Number(dateParts.month) - 1,
    Number(dateParts.day),
  ));
};

export const calculateSensitivityLevel = (score: number): SensitivityLevel => {
  return getSensitivityLevel(score);
};

export const calculateCondition = (body: CreateTodayConditionRequestDto) => {
  const scores = {
    sleep: CONDITION_SCORE_POLICY.sleep[body.sleepLevel],
    noise: CONDITION_SCORE_POLICY.noise[body.noiseLevel],
    visual: CONDITION_SCORE_POLICY.visual[body.visualLevel],
    social: CONDITION_SCORE_POLICY.social[body.socialLevel],
    energy: CONDITION_SCORE_POLICY.energy[body.energyLevel],
  };
  const sensitivityScore = Object.values(scores).reduce(
    (total, score) => total + score,
    0,
  );
  const triggerCodes: TriggerCode[] = [];
  if (scores.sleep >= CONDITION_TRIGGER_THRESHOLD) triggerCodes.push("SLEEP_DEPRIVATION");
  if (scores.noise >= CONDITION_TRIGGER_THRESHOLD) triggerCodes.push("NOISE_EXPOSURE");
  if (scores.visual >= CONDITION_TRIGGER_THRESHOLD) triggerCodes.push("VISUAL_STIMULATION");
  if (scores.social >= CONDITION_TRIGGER_THRESHOLD) triggerCodes.push("SOCIAL_ISOLATION");
  if (scores.energy >= CONDITION_TRIGGER_THRESHOLD) triggerCodes.push("LOW_ENERGY");

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
