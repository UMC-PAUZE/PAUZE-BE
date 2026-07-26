import type {
  InsightCandidate,
  ReportPeriodType,
} from "../calculator/insight.types.js";

const periodLabel = (periodType: ReportPeriodType): string =>
  periodType === "WEEKLY" ? "이번 주" : "이번 달";

export const createInsightContent = (
  candidate: InsightCandidate,
  periodType: ReportPeriodType,
): string => {
  const metrics = candidate.metrics;
  switch (candidate.type) {
    case "HARDEST_DAY":
      return `${metrics.dayOfWeek}에 예민함이 가장 높아요. ${metrics.previousDayOfWeek} 저녁에 미리 PAUZE를 해보세요.`;
    case "SLEEP_CORRELATION":
      return `수면이 충분했던 날은 부족했던 날보다 예민함이 평균 ${metrics.differencePercent}% 낮았어요. 충분히 쉬는 날을 의식적으로 만들어보세요.`;
    case "TOP_TRIGGER":
      return `${periodLabel(periodType)} ${metrics.triggerName}이 ${metrics.triggerCount}회로 가장 잦은 트리거였어요. 자극이 커지기 전에 잠시 쉬어보세요.`;
    case "PAUZE_EFFECT":
      return `PAUZE를 한 날은 하지 않은 날보다 예민함이 평균 ${metrics.difference}점 낮았어요. 필요할 때 부담 없이 활용해보세요.`;
    case "RECOVERY_SPEED":
      return `높은 예민함 이후 평균 ${metrics.averageRecoveryDays}일 만에 점수가 안정됐어요. 회복할 여유를 미리 마련해보세요.`;
    case "ACCUMULATED_FATIGUE":
      return `예민함이 높은 흐름이 ${metrics.consecutiveDays}일 이어졌어요. 짧게라도 자극에서 벗어나는 시간을 가져보세요.`;
    case "TRIGGER_COMBINATION":
      return `${periodLabel(periodType)} ${metrics.firstTriggerName}과 ${metrics.secondTriggerName}이 함께 높았던 날은 평균보다 ${metrics.difference}점 높았어요. 두 자극이 겹치는 상황을 살펴보세요.`;
    case "INSUFFICIENT_DATA":
      return "아직 뚜렷한 패턴을 확인하기 어려워요. 컨디션을 꾸준히 입력하면 나에게 맞는 인사이트를 확인할 수 있어요.";
  }
};
