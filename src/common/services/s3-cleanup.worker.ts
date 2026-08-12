import { randomUUID } from "node:crypto";
import { prisma } from "../../db.config.js";
import { deleteObject } from "../utils/s3.util.js";

const RETRY_INTERVAL_MS = 60_000;
const BATCH_SIZE = 20;
const LEASE_MS = 5 * 60_000;

export type S3CleanupTask = {
  cleanupId: bigint;
  objectKey: string;
  attempts: number;
  lockToken: string;
};

export interface S3CleanupTaskRepository {
  claimPending(limit: number, leaseUntil: Date, lockToken: string): Promise<S3CleanupTask[]>;
  complete(cleanupId: bigint, lockToken: string): Promise<void>;
  recordFailure(
    cleanupId: bigint,
    lockToken: string,
    error: string,
    nextAttemptAt: Date,
  ): Promise<void>;
}

const cleanupTaskRepository: S3CleanupTaskRepository = {
  async claimPending(limit, leaseUntil, lockToken) {
    const now = new Date();
    const candidates = await prisma.s3CleanupTask.findMany({
      where: {
        nextAttemptAt: { lte: now },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      orderBy: { cleanupId: "asc" },
      take: limit,
      select: { cleanupId: true },
    });

    const claimed: S3CleanupTask[] = [];
    for (const candidate of candidates) {
      const result = await prisma.s3CleanupTask.updateMany({
        where: {
          cleanupId: candidate.cleanupId,
          nextAttemptAt: { lte: now },
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        data: {
          lockedUntil: leaseUntil,
          lockToken,
        },
      });
      if (result.count !== 1) continue;

      const task = await prisma.s3CleanupTask.findUnique({
        where: { cleanupId: candidate.cleanupId },
        select: {
          cleanupId: true,
          objectKey: true,
          attempts: true,
          lockToken: true,
        },
      });
      if (task?.lockToken === lockToken) {
        claimed.push({
          cleanupId: task.cleanupId,
          objectKey: task.objectKey,
          attempts: task.attempts,
          lockToken,
        });
      }
    }
    return claimed;
  },

  async complete(cleanupId, lockToken) {
    await prisma.s3CleanupTask.deleteMany({
      where: { cleanupId, lockToken },
    });
  },

  async recordFailure(cleanupId, lockToken, error, nextAttemptAt) {
    await prisma.s3CleanupTask.updateMany({
      where: { cleanupId, lockToken },
      data: {
        attempts: { increment: 1 },
        lastError: error.slice(0, 2000),
        nextAttemptAt,
        lockedUntil: null,
        lockToken: null,
      },
    });
  },
};

export async function runS3CleanupBatch(
  repository: S3CleanupTaskRepository,
  removeObject: (key: string) => Promise<void>,
): Promise<void> {
  const lockToken = randomUUID();
  const leaseUntil = new Date(Date.now() + LEASE_MS);
  const tasks = await repository.claimPending(BATCH_SIZE, leaseUntil, lockToken);

  for (const task of tasks) {
    try {
      await removeObject(task.objectKey);
      await repository.complete(task.cleanupId, task.lockToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const delay = Math.min(60 * 60_000, RETRY_INTERVAL_MS * 2 ** task.attempts);
      await repository.recordFailure(
        task.cleanupId,
        task.lockToken,
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
  let running = false;

  const tick = () => {
    if (running) return;
    running = true;
    void processPendingS3CleanupTasks()
      .catch((error) => {
        console.error("[S3CleanupWorker] run failed", error);
      })
      .finally(() => {
        running = false;
      });
  };

  tick();
  const timer = setInterval(tick, RETRY_INTERVAL_MS);
  timer.unref();
  return timer;
}
