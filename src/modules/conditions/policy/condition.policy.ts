import type {
  EnergyLevel,
  NoiseLevel,
  SensitivityLevel,
  SleepLevel,
  SocialLevel,
  VisualLevel,
} from "../dto/condition.dto.js";

export const CONDITION_TRIGGER_THRESHOLD = 13;

export const CONDITION_SCORE_POLICY = {
  sleep: {
    OVER_8: 0,
    SIX_TO_EIGHT: 7,
    FOUR_TO_SIX: 13,
    LESS_4: 20,
  } satisfies Record<SleepLevel, number>,
  noise: {
    QUIET: 0,
    NORMAL: 7,
    UNCOMFORTABLE: 13,
    HARD: 20,
  } satisfies Record<NoiseLevel, number>,
  visual: {
    LOW: 0,
    NORMAL: 7,
    HIGH: 13,
    VERY_HIGH: 20,
  } satisfies Record<VisualLevel, number>,
  social: {
    ALONE: 0,
    LITTLE: 7,
    SOME: 13,
    MANY: 20,
  } satisfies Record<SocialLevel, number>,
  energy: {
    ENOUGH: 0,
    NORMAL: 7,
    LOW: 13,
    NONE: 20,
  } satisfies Record<EnergyLevel, number>,
} as const;

export const getSensitivityLevel = (score: number): SensitivityLevel => {
  if (score <= 40) return "LOW";
  if (score <= 65) return "NORMAL";
  return "HIGH";
};
