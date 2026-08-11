import { prisma } from "../../db.config.js";
import { deleteObject } from "../utils/s3.util.js";

const RETRY_INTERVAL_MS = 60_000;
const BATCH_SIZE = 20;

export type S3CleanupTask = {
  cleanupId: bigint;
  objectKey: string;
  attempts: number;
};

export interface S3CleanupTaskRepository {
  findPending(): Promise<S3CleanupTask[]>;
  complete(cleanupId: bigint): Promise<void>;
  recordFailure(cleanupId: bigint, error: string, nextAttemptAt: Date): Promise<void>;
}

const cleanupTaskRepository: S3CleanupTaskRepository = {
  findPending() {
    return prisma.s3CleanupTask.findMany({
    where: { nextAttemptAt: { lte: new Date() } },
    orderBy: { cleanupId: "asc" },
    take: BATCH_SIZE,
      select: { cleanupId: true, objectKey: true, attempts: true },
    });
  },
  async complete(cleanupId) {
    await prisma.s3CleanupTask.deleteMany({ where: { cleanupId } });
  },
  async recordFailure(cleanupId, error, nextAttemptAt) {
    await prisma.s3CleanupTask.updateMany({
      where: { cleanupId },
      data: {
        attempts: { increment: 1 },
        lastError: error.slice(0, 2000),
        nextAttemptAt,
      },
    });
  },
};

export async function runS3CleanupBatch(
  repository: S3CleanupTaskRepository,
  removeObject: (key: string) => Promise<void>,
): Promise<void> {
  const tasks = await repository.findPending();

  for (const task of tasks) {
    try {
      await removeObject(task.objectKey);
      await repository.complete(task.cleanupId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const delay = Math.min(60 * 60_000, RETRY_INTERVAL_MS * 2 ** task.attempts);
      await repository.recordFailure(
        task.cleanupId,
        message,
        new Date(Date.now() + delay),
      );
    }
  }
}

export async function processPendingS3CleanupTasks(): Promise<void> {
  await runS3CleanupBatch(cleanupTaskRepository, deleteObject);
}

export function startS3CleanupWorker(): NodeJS.Timeout {
  void processPendingS3CleanupTasks().catch((error) => {
    console.error("[S3CleanupWorker] initial run failed", error);
  });

  const timer = setInterval(() => {
    void processPendingS3CleanupTasks().catch((error) => {
      console.error("[S3CleanupWorker] run failed", error);
    });
  }, RETRY_INTERVAL_MS);
  timer.unref();
  return timer;
}
