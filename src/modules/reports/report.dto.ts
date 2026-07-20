export type ReportTriggerCode =
  | "SLEEP_DEPRIVATION"
  | "NOISE_EXPOSURE"
  | "VISUAL_STIMULATION"
  | "SOCIAL_ISOLATION"
  | "LOW_ENERGY";

export interface ReportConditionRecord {
  conditionDate: Date;
  sensitivityScore: number;
  triggerCodes: ReportTriggerCode[];
  sleepLevel: SleepLevel;
  noiseLevel: NoiseLevel;
  visualLevel: VisualLevel;
  socialLevel: SocialLevel;
  energyLevel: EnergyLevel;
}

export interface DailyScoreDto {
  /** 요일(월, 화, 수, 목, 금, 토, 일) */
  day: string;
  /** 해당 날짜의 예민함 점수 */
  score: number;
}

export interface WeeklyScoreDto {
  /** 월요일 기준 월간 주차 */
  week: string;
  /** 해당 주차 체크인 점수 평균(반올림) */
  averageScore: number;
}

export interface TopTriggerDto {
  /** 빈도순 순위 */
  rank: number;
  /** 체크인 트리거 표시명 */
  trigger: string;
  /** 기간 내 발생 횟수 */
  count: number;
}

export interface WeeklyReportDto {
  /** 현재 주 체크인 평균(반올림) */
  averageScore: number;
  /** 가장 높은 점수를 기록한 요일 */
  hardestDay: string;
  /** 가장 높은 일간 점수 */
  hardestScore: number;
  /** PAUZE 실행 횟수. 실행 기록 모델 도입 전까지 0 */
  pauzeCount: number;
  /** 현재 주 평균 - 이전 주 평균. 이전 데이터가 없으면 null */
  scoreChange: number | null;
  /** 체크인한 날짜만 월요일부터 일요일 순으로 반환 */
  dailyScores: DailyScoreDto[];
  /** 트리거 빈도순 최대 5개 */
  topTriggers: TopTriggerDto[];
  /** 리포트 값에 기반한 규칙형 인사이트 */
  insights: string[];
}

export interface MonthlyReportDto {
  /** 현재 월 체크인 평균(반올림) */
  averageScore: number;
  /** 가장 높은 평균을 기록한 주차 */
  hardestWeek: string;
  /** 가장 높은 주차 평균 점수 */
  hardestScore: number;
  /** PAUZE 실행 횟수. 실행 기록 모델 도입 전까지 0 */
  pauzeCount: number;
  /** 현재 월 평균 - 이전 월 평균. 이전 데이터가 없으면 null */
  scoreChange: number | null;
  /** 체크인 데이터가 있는 주차만 시간순으로 반환 */
  weeklyScores: WeeklyScoreDto[];
  /** 트리거 빈도순 최대 5개 */
  topTriggers: TopTriggerDto[];
  /** 리포트 값에 기반한 규칙형 인사이트 */
  insights: string[];
}

export interface ReportErrorResponseDto {
  isSuccess: false;
  code: string;
  message: string;
  result: unknown[];
}
import type {
  EnergyLevel,
  NoiseLevel,
  SleepLevel,
  SocialLevel,
  VisualLevel,
} from "../conditions/condition.dto.js";
