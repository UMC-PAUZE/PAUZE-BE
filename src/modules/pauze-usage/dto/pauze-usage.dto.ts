export interface PauzeUsageRecordRequest {
  /** 클라이언트가 완료 이벤트마다 한 번 생성하고 재시도 시 재사용하는 UUID */
  completionId: string;
}

export interface PauzeUsageRecordResult {
  usageId: string;
  completionId: string;
  /** UTC 기준 ISO 8601 완료 시각 (예: 2026-08-02T03:30:00.000Z) */
  completedAt: string;
}

export enum PauzeUsageStatisticsPeriod {
  ALL = "ALL",
  WEEK = "WEEK",
  MONTH = "MONTH",
}

export interface PauzeUsageStatistics {
  period: PauzeUsageStatisticsPeriod;
  /** 선택한 기간에 완료한 PAUZE 사용 횟수 */
  usageCount: number;
  /** Asia/Seoul 날짜 기준 현재 연속 PAUZE 사용 일수 */
  currentStreakDays: number;
}
