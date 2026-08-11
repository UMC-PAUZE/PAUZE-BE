import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

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
  categoryId: bigint;
  audioUrl: string;
  createdAt: Date;
}

export interface AudioUploadRepositoryContract {
  categoryExists(categoryId: bigint): Promise<boolean>;
  create(params: AudioUploadCreateParams): Promise<AudioUploadCreatedRow>;
}

export class AudioUploadRepository implements AudioUploadRepositoryContract {
  constructor(private readonly db: PrismaClient) {}

  async categoryExists(categoryId: bigint): Promise<boolean> {
    const category = await this.db.audioCategory.findUnique({
      where: { categoryId },
      select: { categoryId: true },
    });
    return category !== null;
  }

  async create(params: AudioUploadCreateParams): Promise<AudioUploadCreatedRow> {
    return this.db.audioGuide.create({
      data: {
        ...params,
      },
      select: {
        audioId: true,
        audioTitle: true,
        categoryId: true,
        audioUrl: true,
        createdAt: true,
      },
    });
  }
}

export const audioUploadRepository = new AudioUploadRepository(prisma);
