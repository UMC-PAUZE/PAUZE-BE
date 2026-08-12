export interface PauzeUsageRecordRequest {
  /** 클라이언트가 완료 이벤트마다 한 번 생성하고 재시도 시 재사용하는 UUID */
  completionId: string;
}

export interface PauzeUsageRecordResult {
  /** 저장된 PAUZE 사용 기록 식별자 */
  usageId: string;
  /** 중복 저장 방지를 위해 사용한 완료 이벤트 UUID */
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
  /** 통계가 집계된 조회 기간 */
  period: PauzeUsageStatisticsPeriod;
  /** 선택한 기간에 완료한 PAUZE 사용 횟수 */
  usageCount: number;
  /** Asia/Seoul 날짜 기준 현재 연속 PAUZE 사용 일수 */
  currentStreakDays: number;
}
