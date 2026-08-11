import { prisma } from "../../../db.config.js";
import type { ReportConditionRecord } from "../dto/report.dto.js";
import type {
  InsightCandidate,
  ReportPeriodType,
  TriggerRankMetric,
} from "../calculator/insight.types.js";
import type { GeneratedInsight } from "../generator/insight-generation.types.js";

export const findConditionsByUserAndDateRange = async (
  uid: string,
  start: Date,
  endExclusive: Date,
): Promise<ReportConditionRecord[]> => {
  const conditions = await prisma.condition.findMany({
    where: {
      uid,
      conditionDate: {
        gte: start,
        lt: endExclusive,
      },
    },
    orderBy: { conditionDate: "asc" },
    select: {
      conditionDate: true,
      sensitivityScore: true,
      sleepLevel: true,
      noiseLevel: true,
      visualLevel: true,
      socialLevel: true,
      energyLevel: true,
      conditionTriggers: {
        select: {
          trigger: { select: { code: true } },
        },
      },
    },
  });

  return conditions.map(({ conditionTriggers, ...condition }) => ({
    ...condition,
    triggerCodes: conditionTriggers.map(({ trigger }) => trigger.code) as ReportConditionRecord["triggerCodes"],
  }));
};

export const findPauzeUsagesByUserAndDateRange = async (
  uid: string,
  start: Date,
  endExclusive: Date,
): Promise<Date[]> => {
  const usages = await prisma.pauzeUsage.findMany({
    where: {
      uid,
      completedAt: {
        gte: start,
        lt: endExclusive,
      },
    },
    select: { completedAt: true },
  });
  return usages.map(({ completedAt }) => completedAt);
};

export const findStoredReport = (
  uid: string,
  reportType: ReportPeriodType,
  periodStart: Date,
  periodEnd: Date,
) =>
  prisma.sensitivityReport.findUnique({
    where: {
      uid_reportType_periodStart_periodEnd: {
        uid,
        reportType,
        periodStart,
        periodEnd,
      },
    },
    include: {
      triggerRanks: {
        include: { trigger: { select: { code: true, name: true } } },
        orderBy: { rankOrder: "asc" },
      },
      insights: { orderBy: { displayOrder: "asc" } },
    },
  });

export interface ReplaceStoredReportParams {
  uid: string;
  reportType: ReportPeriodType;
  periodStart: Date;
  periodEnd: Date;
  validConditionDays: number;
  averageScore: number;
  previousAverageScore: number | null;
  scoreChange: number | null;
  pauzeCount: number;
  sourceDataHash: string;
  triggerRanks: TriggerRankMetric[];
  insights: GeneratedInsight[];
}

export const replaceStoredReport = async ({
  uid,
  reportType,
  periodStart,
  periodEnd,
  validConditionDays,
  averageScore,
  previousAverageScore,
  scoreChange,
  pauzeCount,
  sourceDataHash,
  triggerRanks,
  insights,
}: ReplaceStoredReportParams) => {
  await prisma.$transaction(async (transaction) => {
    const now = new Date();
    const report = await transaction.sensitivityReport.upsert({
      where: {
        uid_reportType_periodStart_periodEnd: {
          uid,
          reportType,
          periodStart,
          periodEnd,
        },
      },
      create: {
        uid,
        reportType,
        periodStart,
        periodEnd,
        validConditionDays,
        averageScore,
        previousAverageScore,
        scoreChange,
        pauzeCount,
        sourceDataHash,
        createdAt: now,
        updatedAt: now,
      },
      update: {
        validConditionDays,
        averageScore,
        previousAverageScore,
        scoreChange,
        pauzeCount,
        sourceDataHash,
        updatedAt: now,
      },
      select: { reportId: true },
    });

    await transaction.reportTriggerRank.deleteMany({
      where: { reportId: report.reportId },
    });
    await transaction.reportInsight.deleteMany({
      where: { reportId: report.reportId },
    });

    if (triggerRanks.length > 0) {
      const triggers = await transaction.trigger.findMany({
        where: { code: { in: triggerRanks.map(({ code }) => code) } },
        select: { triggerId: true, code: true },
      });
      const triggerIds = new Map(
        triggers.map(({ triggerId, code }) => [code, triggerId]),
      );
      if (triggerIds.size !== triggerRanks.length) {
        throw new Error("리포트 순위에 필요한 트리거 기준정보가 없습니다.");
      }
      await transaction.reportTriggerRank.createMany({
        data: triggerRanks.map((rank) => ({
          reportId: report.reportId,
          triggerId: triggerIds.get(rank.code)!,
          rankOrder: rank.rankOrder,
          averageScore: rank.averageScore,
          triggerCount: rank.triggerCount,
          highestScoreCount: rank.highestScoreCount,
          createdAt: now,
          updatedAt: now,
        })),
      });
    }

    await transaction.reportInsight.createMany({
      data: insights.map((insight, index) => ({
        reportId: report.reportId,
        insightType: insight.candidate.type,
        content: insight.content,
        displayOrder: index + 1,
        generationSource: insight.generationSource,
        modelName: insight.modelName,
        promptVersion: insight.promptVersion,
        metricsJson: insight.metrics,
        calculationHash: insight.calculationHash,
        generatedAt: insight.generatedAt,
        generationError: insight.generationError,
        createdAt: now,
        updatedAt: now,
      })),
    });
  });

  return findStoredReport(uid, reportType, periodStart, periodEnd);
};
