import { AppError } from "../../../common/errors/app.error.js";
import type {
  PauzeUsageRecordResult,
  PauzeUsageStatistics,
} from "../dto/pauze-usage.dto.js";
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
          // eslint-disable-next-line no-console
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

  async getStatistics(uid: string): Promise<PauzeUsageStatistics> {
    try {
      const [totalUsageCount, completedDates] = await Promise.all([
        this.pauzeUsageRepository.countByUser(uid),
        this.pauzeUsageRepository.findCompletedDates(uid),
      ]);
      const usageDays = this.toUniqueUsageDays(
        completedDates.map(({ completedAt }) => completedAt),
      );

      return {
        totalUsageCount,
        currentStreakDays: this.calculateCurrentStreak(usageDays),
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[PauzeUsageService] statistics query failed", error);
      throw new AppError({
        code: PAUZE_USAGE_CODES.STATISTICS_GET_FAILED,
        message: PAUZE_USAGE_MESSAGES.STATISTICS_GET_FAILED,
        statusCode: 500,
      });
    }
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
