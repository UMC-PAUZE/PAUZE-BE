import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class AudioSaveRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByAudioIdAndUid(audioId: bigint, uid: string) {
    return this.db.audioSave.findUnique({
      where: {
        audioId_uid: { audioId, uid },
      },
    });
  }

  async create(audioId: bigint, uid: string) {
    return this.db.audioSave.create({
      data: { audioId, uid },
    });
  }

  async delete(saveId: bigint) {
    return this.db.audioSave.delete({
      where: { saveId },
    });
  }
}

export const audioSaveRepository = new AudioSaveRepository(prisma);
