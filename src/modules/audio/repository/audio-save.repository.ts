import { prisma } from "../../../db.config.js";
import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";

const MAX_TOGGLE_ATTEMPTS = 3;

export class AudioSaveRepository {
  constructor(private readonly db: PrismaClient) {}

  async toggle(audioId: bigint, uid: string): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_TOGGLE_ATTEMPTS; attempt += 1) {
      try {
        return await this.db.$transaction(
          async (tx) => {
            const existing = await tx.audioSave.findUnique({
              where: { audioId_uid: { audioId, uid } },
            });

            if (existing) {
              await tx.audioSave.delete({
                where: { audioId_uid: { audioId, uid } },
              });
              return false;
            }

            await tx.audioSave.create({ data: { audioId, uid } });
            return true;
          },
          { isolationLevel: "Serializable" },
        );
      } catch (error) {
        if (!this.isRetryableConflict(error) || attempt === MAX_TOGGLE_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error("Audio save toggle retry exhausted");
  }

  private isRetryableConflict(error: unknown): boolean {
      return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2025", "P2034"].includes(error.code)
      );
    }
}

export const audioSaveRepository = new AudioSaveRepository(prisma);
