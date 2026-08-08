import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { AudioCategoryCode } from "../dto/audio.dto.js";

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
  savedBy?: { saveId: bigint }[];
};

export class AudioGuideRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(userId?: string): Promise<AudioGuideListRow[]> {
    return this.db.audioGuide.findMany({
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
        savedBy: userId
          ? {
              where: { uid: userId },
              select: { saveId: true },
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
        savedBy: userId
          ? {
              where: { uid: userId },
              select: { saveId: true },
            }
          : false,
      },
    });
  }

  async findManyLikedByUser(uid: string): Promise<AudioGuideListRow[]> {
    return this.findManyByUserRelation(uid, "liked");
  }

  async findManySavedByUser(uid: string): Promise<AudioGuideListRow[]> {
    return this.findManyByUserRelation(uid, "saved");
  }

  private async findManyByUserRelation(
    uid: string,
    relation: "liked" | "saved",
  ): Promise<AudioGuideListRow[]> {
    return this.db.audioGuide.findMany({
      where:
        relation === "liked"
          ? { likedBy: { some: { uid } } }
          : { savedBy: { some: { uid } } },
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
        savedBy: {
          where: { uid },
          select: { saveId: true },
        },
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
