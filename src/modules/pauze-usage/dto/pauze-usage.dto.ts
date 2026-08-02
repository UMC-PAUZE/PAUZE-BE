export interface PauzeUsageRecordRequest {
  /** 클라이언트가 완료 이벤트마다 한 번 생성하고 재시도 시 재사용하는 UUID */
  completionId: string;
}

export interface PauzeUsageRecordResult {
  usageId: string;
  completionId: string;
  completedAt: string;
}

export interface PauzeUsageStatistics {
  totalUsageCount: number;
  currentStreakDays: number;
}
