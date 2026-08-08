import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class PauzeUsageRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(uid: string, completionId: string) {
    return this.db.pauzeUsage.create({
      data: {
        uid,
        completionId,
        // Date는 절대 시점을 나타내며 API 응답에서는 UTC ISO 문자열로 변환합니다.
        completedAt: new Date(),
      },
      select: {
        usageId: true,
        completionId: true,
        completedAt: true,
      },
    });
  }

  async findByUserAndCompletionId(uid: string, completionId: string) {
    return this.db.pauzeUsage.findUnique({
      where: {
        uid_completionId: {
          uid,
          completionId,
        },
      },
      select: {
        usageId: true,
        completionId: true,
        completedAt: true,
      },
    });
  }

  async countByUser(uid: string): Promise<number> {
    return this.db.pauzeUsage.count({
      where: { uid },
    });
  }

  async findCompletedDates(
    uid: string,
    options?: { since?: Date },
  ): Promise<{ completedAt: Date }[]> {
    return this.db.pauzeUsage.findMany({
      where: {
        uid,
        ...(options?.since ? { completedAt: { gte: options.since } } : {}),
      },
      select: {
        completedAt: true,
      },
      orderBy: {
        completedAt: "asc",
      },
    });
  }
}

export const pauzeUsageRepository = new PauzeUsageRepository(prisma);
