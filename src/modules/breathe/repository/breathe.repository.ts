import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class BreatheGuideRepository {
  constructor(private readonly db: PrismaClient) {}

  async withMutationLock<T>(
    operation: (repository: BreatheGuideRepository) => Promise<T>,
  ): Promise<T> {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT lock_id FROM breathe_guide_lock WHERE lock_id = 1 FOR UPDATE`;
      return operation(new BreatheGuideRepository(tx as unknown as PrismaClient));
    });
  }

  async findCurrent() {
    return this.db.breatheGuide.findUnique({
      where: { singletonKey: 1 },
      select: {
        breatheId: true,
        breatheKey: true,
        breatheUrl: true,
      },
    });
  }

  async saveCurrent(params: {
    breatheId?: bigint;
    breatheKey: string;
    breatheUrl: string;
    createdAt: Date;
  }) {
    const { breatheId: _breatheId, createdAt, ...data } = params;
    const select = {
      breatheId: true,
      breatheKey: true,
      breatheUrl: true,
      createdAt: true,
    } as const;

    return this.db.breatheGuide.upsert({
      where: { singletonKey: 1 },
      update: { ...data, updatedAt: new Date() },
      create: { ...data, singletonKey: 1, createdAt },
      select,
    });
  }

  async enqueueCleanup(objectKey: string): Promise<void> {
    await this.db.s3CleanupTask.upsert({
      where: { objectKey },
      update: {},
      create: { objectKey },
    });
  }
}

export const breatheGuideRepository = new BreatheGuideRepository(prisma);
