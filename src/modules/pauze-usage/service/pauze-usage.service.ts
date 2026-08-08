import { AppError } from "../../../common/errors/app.error.js";
import type {
  PauzeUsageRecordResult,
  PauzeUsageStatistics,
} from "../dto/pauze-usage.dto.js";
import { PauzeUsageStatisticsPeriod } from "../dto/pauze-usage.dto.js";
import {
  PAUZE_USAGE_CODES,
  PAUZE_USAGE_MESSAGES,
} from "../errors/pauze-usage.errors.js";
import {
  type PauzeUsageRepository,
  pauzeUsageRepository,
} from "../repository/pauze-usage.repository.js";

export class PauzeUsageService {
  constructor(
    private readonly pauzeUsageRepository: PauzeUsageRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async recordUsage(
    uid: string,
    completionId: string,
  ): Promise<PauzeUsageRecordResult> {
    let usage: Awaited<ReturnType<PauzeUsageRepository["create"]>>;

    try {
      usage = await this.pauzeUsageRepository.create(uid, completionId);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        try {
          const existing =
            await this.pauzeUsageRepository.findByUserAndCompletionId(
              uid,
              completionId,
            );
          if (existing) {
            usage = existing;
          } else {
            throw error;
          }
        } catch (fallbackError) {
          console.error(
            "[PauzeUsageService] save fallback failed",
            fallbackError,
          );
          throw this.createSaveFailedError();
        }
      } else {
        console.error("[PauzeUsageService] save failed", error);
        throw this.createSaveFailedError();
      }
    }

    return {
      usageId: usage.usageId.toString(),
      completionId: usage.completionId,
      completedAt: usage.completedAt.toISOString(),
    };
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    );
  }

  private createSaveFailedError(): AppError {
    return new AppError({
      code: PAUZE_USAGE_CODES.SAVE_FAILED,
      message: PAUZE_USAGE_MESSAGES.SAVE_FAILED,
      statusCode: 500,
    });
  }

  async getStatistics(
    uid: string,
    period: PauzeUsageStatisticsPeriod = PauzeUsageStatisticsPeriod.ALL,
  ): Promise<PauzeUsageStatistics> {
    try {
      const since = this.getPeriodStart(period);
      const [usageCount, completedDates] = await Promise.all([
        this.pauzeUsageRepository.countByUser(
          uid,
          since ? { since } : undefined,
        ),
        // 현재 연속 일수는 주·월 경계를 넘어갈 수 있어 전체 이력을 조회합니다.
        this.pauzeUsageRepository.findCompletedDates(uid),
      ]);
      const usageDays = this.toUniqueUsageDays(
        completedDates.map(({ completedAt }) => completedAt),
      );

      return {
        period,
        usageCount,
        currentStreakDays: this.calculateCurrentStreak(usageDays),
      };
    } catch (error) {
      console.error("[PauzeUsageService] statistics query failed", error);
      throw new AppError({
        code: PAUZE_USAGE_CODES.STATISTICS_GET_FAILED,
        message: PAUZE_USAGE_MESSAGES.STATISTICS_GET_FAILED,
        statusCode: 500,
      });
    }
  }

  private getPeriodStart(period: PauzeUsageStatisticsPeriod): Date | undefined {
    if (period === PauzeUsageStatisticsPeriod.ALL) {
      return undefined;
    }

    const koreaTime = new Date(this.now().getTime() + 9 * 60 * 60 * 1000);
    const year = koreaTime.getUTCFullYear();
    const month = koreaTime.getUTCMonth();
    const date = koreaTime.getUTCDate();

    if (period === PauzeUsageStatisticsPeriod.MONTH) {
      return new Date(Date.UTC(year, month, 1, -9));
    }

    const daysSinceMonday = (koreaTime.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(year, month, date - daysSinceMonday, -9));
  }

  private toUniqueUsageDays(completedDates: Date[]): number[] {
    return [...new Set(completedDates.map((date) => this.toKoreaDay(date)))].sort(
      (a, b) => a - b,
    );
  }

  private calculateCurrentStreak(usageDays: number[]): number {
    if (usageDays.length === 0) {
      return 0;
    }

    const today = this.toKoreaDay(this.now());
    const lastUsageDay = usageDays[usageDays.length - 1];
    if (
      lastUsageDay === undefined ||
      lastUsageDay < today - 1 ||
      lastUsageDay > today
    ) {
      return 0;
    }

    let streak = 1;
    for (let index = usageDays.length - 1; index > 0; index -= 1) {
      const currentDay = usageDays[index];
      const previousDay = usageDays[index - 1];
      if (
        currentDay === undefined ||
        previousDay === undefined ||
        currentDay - previousDay !== 1
      ) {
        break;
      }
      streak += 1;
    }

    return streak;
  }

  private toKoreaDay(date: Date): number {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);
    const values = Object.fromEntries(
      parts
        .filter(({ type }) => type === "year" || type === "month" || type === "day")
        .map(({ type, value }) => [type, Number(value)]),
    ) as Record<"year" | "month" | "day", number>;

    return Math.floor(
      Date.UTC(values.year, values.month - 1, values.day) / 86_400_000,
    );
  }
}

export const pauzeUsageService = new PauzeUsageService(pauzeUsageRepository);
