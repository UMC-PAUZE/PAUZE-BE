import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { AudioCategoryCode } from "../dto/audio.dto.js";

export type AudioGuideListRow = {
  audioId: bigint;
  audioTitle: string;
  audioUrl: string;
  categoryId: bigint;
  category: {
    categoryName: string;
  };
  likedBy?: { likedId: bigint }[];
};

export class AudioGuideRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(userId?: string): Promise<AudioGuideListRow[]> {
    return this.db.audioGuide.findMany({
      include: {
        category: true,
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
    userId?: string,
  ): Promise<AudioGuideListRow[]> {
    return this.db.audioGuide.findMany({
      where: {
        category: {
          audioCode: {
            codeName: categoryCode,
          },
        },
      },
      include: {
        category: true,
        likedBy: userId
          ? {
              where: { uid: userId },
              select: { likedId: true },
            }
          : false,
      },
    });
  }

  async findById(audioId: bigint) {
    return this.db.audioGuide.findUnique({
      where: { audioId },
    });
  }
}

export const audioGuideRepository = new AudioGuideRepository(prisma);
