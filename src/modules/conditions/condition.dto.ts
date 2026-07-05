export type SleepLevel =
  | "LESS_THAN_FOUR"
  | "FOUR_TO_SIX"
  | "SIX_TO_EIGHT"
  | "OVER_EIGHT";
export type NoiseLevel = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";
export type VisualLevel = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";
export type SocialLevel = "NONE" | "SOME" | "MANY" | "TOO_MUCH";
export type EnergyLevel = "HIGH" | "NORMAL" | "LOW" | "VERY_LOW";

export type SensitivityLevel = "LOW" | "NORMAL" | "HIGH";

export type TriggerCode =
  | "SLEEP_DEPRIVATION"
  | "NOISE_STIMULATION"
  | "VISUAL_STIMULATION"
  | "SOCIAL_STIMULATION"
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
