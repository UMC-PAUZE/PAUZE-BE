import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";
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
    categoryName: string;
    audioCode: { codeName: string };
  };
  likedBy?: { likedId: bigint }[];
};

export type AudioGuideRelationListRow = {
  cursorId: bigint;
  audio: AudioGuideListRow;
};

export class AudioGuideRepository {
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
            categoryName: true,
            audioCode: { select: { codeName: true } },
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
          audioCode: {
            codeName: categoryCode,
          },
        },
        audioId: pagination.cursor ? { lt: pagination.cursor } : undefined,
      },
      orderBy: { audioId: "desc" },
      take: pagination.size + 1,
      include: {
        category: {
          select: {
            categoryName: true,
            audioCode: { select: { codeName: true } },
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
                categoryName: true,
                audioCode: { select: { codeName: true } },
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
}

export const audioGuideRepository = new AudioGuideRepository(prisma);
