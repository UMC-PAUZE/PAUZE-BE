import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { AudioCategoryCode as PrismaAudioCategoryCode } from "../../../generated/prisma/enums.js";
import type {
  AudioCategoryCode,
  AudioCursorPagination,
} from "../dto/audio.dto.js";

export type AudioGuideListRow = {
  audioId: bigint;
  audioTitle: string;
  audioUrl: string;
  audioKey: string;
  categoryId: bigint;
  category: {
    categoryCode: PrismaAudioCategoryCode;
  };
  likedBy?: { likedId: bigint }[];
};

export type AudioGuideRelationListRow = {
  cursorId: bigint;
  audio: AudioGuideListRow;
};

export type AudioGuideDeleteRow = {
  audioId: bigint;
  audioKey: string;
};

export type AudioCleanupTaskRow = {
  cleanupId: bigint;
  audioId: bigint;
  audioKey: string;
};

export interface AudioGuideRepositoryContract {
  findMany(
    pagination: AudioCursorPagination,
    userId?: string,
  ): Promise<AudioGuideListRow[]>;
  findManyByCategoryCode(
    categoryCode: AudioCategoryCode,
    pagination: AudioCursorPagination,
    userId?: string,
  ): Promise<AudioGuideListRow[]>;
  findManyLikedByUser(
    uid: string,
    pagination: AudioCursorPagination,
  ): Promise<AudioGuideRelationListRow[]>;
  findById(audioId: bigint): Promise<AudioGuideDeleteRow | null>;
  deleteByIdWithCleanup(audioId: bigint): Promise<AudioCleanupTaskRow | null>;
  completeCleanup(cleanupId: bigint): Promise<void>;
  recordCleanupFailure(cleanupId: bigint, error: string): Promise<void>;
}

export class AudioGuideRepository implements AudioGuideRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  async findMany(
    pagination: AudioCursorPagination,
    userId?: string,
  ): Promise<AudioGuideListRow[]> {
    return this.db.audioGuide.findMany({
      where: {
        audioId: pagination.cursor ? { lt: pagination.cursor } : undefined,
      },
      orderBy: { audioId: "desc" },
      take: pagination.size + 1,
      include: {
        category: {
          select: {
            categoryCode: true,
          },
        },
        likedBy: userId
          ? {
              where: { uid: userId },
              select: { likedId: true },
            }
          : false,
      },
    });
  }

  async findManyByCategoryCode(
    categoryCode: AudioCategoryCode,
    pagination: AudioCursorPagination,
    userId?: string,
  ): Promise<AudioGuideListRow[]> {
    return this.db.audioGuide.findMany({
      where: {
        category: {
          categoryCode,
        },
        audioId: pagination.cursor ? { lt: pagination.cursor } : undefined,
      },
      orderBy: { audioId: "desc" },
      take: pagination.size + 1,
      include: {
        category: {
          select: {
            categoryCode: true,
          },
        },
        likedBy: userId
          ? {
              where: { uid: userId },
              select: { likedId: true },
            }
          : false,
      },
    });
  }

  async findManyLikedByUser(
    uid: string,
    pagination: AudioCursorPagination,
  ): Promise<AudioGuideRelationListRow[]> {
    const rows = await this.db.audioLiked.findMany({
      where: {
        uid,
        likedId: pagination.cursor ? { lt: pagination.cursor } : undefined,
      },
      orderBy: { likedId: "desc" },
      take: pagination.size + 1,
      select: {
        likedId: true,
        audio: {
          include: {
            category: {
              select: {
                categoryCode: true,
              },
            },
            likedBy: {
              where: { uid },
              select: { likedId: true },
            },
          },
        },
      },
    });

    return rows.map((row) => ({ cursorId: row.likedId, audio: row.audio }));
  }

  async findById(audioId: bigint) {
    return this.db.audioGuide.findUnique({
      where: { audioId },
    });
  }

  async deleteByIdWithCleanup(
    audioId: bigint,
  ): Promise<AudioCleanupTaskRow | null> {
    return this.db.$transaction(async (tx) => {
      const audio = await tx.audioGuide.findUnique({
        where: { audioId },
        select: { audioId: true, audioKey: true },
      });
      if (!audio) return null;

      const cleanup = await tx.s3CleanupTask.create({
        data: { objectKey: audio.audioKey },
        select: { cleanupId: true },
      });
      await tx.audioGuide.delete({ where: { audioId } });

      return {
        cleanupId: cleanup.cleanupId,
        audioId: audio.audioId,
        audioKey: audio.audioKey,
      };
    });
  }

  async completeCleanup(cleanupId: bigint): Promise<void> {
    await this.db.s3CleanupTask.deleteMany({ where: { cleanupId } });
  }

  async recordCleanupFailure(cleanupId: bigint, error: string): Promise<void> {
    await this.db.s3CleanupTask.update({
      where: { cleanupId },
      data: {
        attempts: { increment: 1 },
        lastError: error.slice(0, 2000),
        nextAttemptAt: new Date(Date.now() + 60_000),
      },
    });
  }
}

export const audioGuideRepository = new AudioGuideRepository(prisma);
