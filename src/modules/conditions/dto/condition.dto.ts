export type SleepLevel = "OVER_8" | "SIX_TO_EIGHT" | "FOUR_TO_SIX" | "LESS_4";
export type NoiseLevel = "QUIET" | "NORMAL" | "UNCOMFORTABLE" | "HARD";
export type VisualLevel = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";
export type SocialLevel = "MANY" | "SOME" | "LITTLE" | "ALONE";
export type EnergyLevel = "ENOUGH" | "NORMAL" | "LOW" | "NONE";
export type SensitivityLevel = "LOW" | "NORMAL" | "HIGH";

export type TriggerCode =
  | "SLEEP_DEPRIVATION"
  | "NOISE_EXPOSURE"
  | "VISUAL_STIMULATION"
  | "SOCIAL_ISOLATION"
  | "LOW_ENERGY";

export interface CreateTodayConditionRequestDto {
  sleepLevel: SleepLevel;
  noiseLevel: NoiseLevel;
  visualLevel: VisualLevel;
  socialLevel: SocialLevel;
  energyLevel: EnergyLevel;
}

export interface CreateTodayConditionResponseDto {
  conditionId: number;
  sensitivityScore: number;
  sensitivityLevel: SensitivityLevel;
  triggerCodes: TriggerCode[];
}

export interface ConditionErrorResponseDto {
  isSuccess: false;
  code: string;
  message: string;
  result: unknown[];
}
