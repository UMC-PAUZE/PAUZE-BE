import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class AudioLikeRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByAudioIdAndUid(audioId: bigint, uid: string) {
    return this.db.audioLiked.findUnique({
      where: {
        audioId_uid: { audioId, uid },
      },
    });
  }

  async create(audioId: bigint, uid: string) {
    return this.db.audioLiked.create({
      data: { audioId, uid },
    });
  }

  async delete(likedId: bigint) {
    return this.db.audioLiked.delete({
      where: { likedId },
    });
  }
}

export const audioLikeRepository = new AudioLikeRepository(prisma);
