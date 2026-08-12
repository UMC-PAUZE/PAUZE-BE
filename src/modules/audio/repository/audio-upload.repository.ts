import { prisma } from "../../../db.config.js";
import type { AudioCategoryCode, PrismaClient } from "../../../generated/prisma/client.js";

export interface AudioUploadCreateParams {
  audioTitle: string;
  categoryId: bigint;
  audioKey: string;
  audioUrl: string;
  createdAt: Date;
}

export interface AudioUploadCreatedRow {
  audioId: bigint;
  audioTitle: string;
  categoryCode: AudioCategoryCode;
  audioUrl: string;
  createdAt: Date;
}

export interface AudioUploadRepositoryContract {
  findCategoryByCode(
    categoryCode: AudioCategoryCode,
  ): Promise<{ categoryId: bigint } | null>;
  create(params: AudioUploadCreateParams): Promise<AudioUploadCreatedRow>;
}

export class AudioUploadRepository implements AudioUploadRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  async findCategoryByCode(
    categoryCode: AudioCategoryCode,
  ): Promise<{ categoryId: bigint } | null> {
    return this.db.audioCategory.findUnique({
      where: { categoryCode },
      select: { categoryId: true },
    });
  }

  async create(params: AudioUploadCreateParams): Promise<AudioUploadCreatedRow> {
    const created = await this.db.audioGuide.create({
      data: {
        ...params,
      },
      select: {
        audioId: true,
        audioTitle: true,
        audioUrl: true,
        createdAt: true,
        category: {
          select: {
            categoryCode: true,
          },
        },
      },
    });

    return {
      audioId: created.audioId,
      audioTitle: created.audioTitle,
      categoryCode: created.category.categoryCode,
      audioUrl: created.audioUrl,
      createdAt: created.createdAt,
    };
  }
}

export const audioUploadRepository = new AudioUploadRepository(prisma);
