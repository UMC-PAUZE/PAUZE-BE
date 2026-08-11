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
  deleteById(audioId: bigint): Promise<void>;
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

  async deleteById(audioId: bigint): Promise<void> {
    await this.db.audioGuide.delete({ where: { audioId } });
  }
}

export const audioGuideRepository = new AudioGuideRepository(prisma);
