export interface PauzeUsageRecordResult {
  usageId: string;
  completionId: string;
  completedAt: string;
}

export interface PauzeUsageStatistics {
  totalUsageCount: number;
  currentStreakDays: number;
}
