import { AppError } from "../../../common/errors/app.error.js";
import type {
  CreateTodayConditionRequestDto,
  CreateTodayConditionResponseDto,
  SensitivityLevel,
  TriggerCode,
} from "../dto/condition.dto.js";
import {
  ConditionAlreadyExistsError,
  ConditionCreateFailedError,
  ConditionDatabaseTimeoutError,
  ConditionDatabaseUnavailableError,
} from "../errors/condition.errors.js";
import {
  CONDITION_SCORE_POLICY,
  CONDITION_TRIGGER_THRESHOLD,
  getSensitivityLevel,
} from "../policy/condition.policy.js";
import {
  findTodayConditionByUserId,
  insertTodayCondition,
} from "../repository/condition.repository.js";

interface ConditionRepository {
  findTodayConditionByUserId: (
    uid: string,
    conditionDate: Date,
  ) => Promise<{ conditionId: bigint } | null>;
  insertTodayCondition: (
    params: Parameters<typeof insertTodayCondition>[0],
  ) => Promise<{
    conditionId: bigint;
    sensitivityScore: number;
    sensitivityLevel: SensitivityLevel;
  }>;
}

const conditionRepository: ConditionRepository = {
  findTodayConditionByUserId,
  insertTodayCondition,
};

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

const getErrorCode = (error: unknown): string | undefined =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string"
    ? error.code
    : undefined;

export const mapConditionCreateError = (error: unknown): AppError => {
  if (error instanceof ConditionAlreadyExistsError) {
    return error;
  }
  if (isUniqueConstraintError(error)) {
    return new ConditionAlreadyExistsError();
  }
  if (error instanceof AppError) {
    return error;
  }

  const errorCode = getErrorCode(error);
  if (
    errorCode === "P1001" ||
    errorCode === "ECONNREFUSED" ||
    errorCode === "ENOTFOUND" ||
    errorCode === "PROTOCOL_CONNECTION_LOST"
  ) {
    return new ConditionDatabaseUnavailableError();
  }
  if (
    errorCode === "P1002" ||
    errorCode === "P2024" ||
    errorCode === "ETIMEDOUT"
  ) {
    return new ConditionDatabaseTimeoutError();
  }
  return new ConditionCreateFailedError();
};

export const createTodayCondition = async (
  uid: string,
  body: CreateTodayConditionRequestDto,
  repository: ConditionRepository = conditionRepository,
): Promise<CreateTodayConditionResponseDto> => {
  const conditionDate = getKstTodayDate();

  try {
    if (await repository.findTodayConditionByUserId(uid, conditionDate)) {
      throw new ConditionAlreadyExistsError();
    }

    const calculated = calculateCondition(body);
    const created = await repository.insertTodayCondition({
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
    const mappedError = mapConditionCreateError(error);
    if (!(mappedError instanceof ConditionAlreadyExistsError)) {
      console.error("[conditions] 오늘의 컨디션 저장 실패", error);
    }
    throw mappedError;
  }
};
