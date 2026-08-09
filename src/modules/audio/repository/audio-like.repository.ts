import { prisma } from "../../../db.config.js";
import { Prisma, type PrismaClient } from "../../../generated/prisma/client.js";


const MAX_TOGGLE_ATTEMPTS = 3;

export class AudioLikeRepository {
  constructor(private readonly db: PrismaClient) {}

  async toggle(audioId: bigint, uid: string): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_TOGGLE_ATTEMPTS; attempt += 1) {
      try {
        return await this.db.$transaction(
          async (tx) => {
            const existing = await tx.audioLiked.findUnique({
              where: { audioId_uid: { audioId, uid } },
            });

            if (existing) {
              await tx.audioLiked.delete({
                where: { audioId_uid: { audioId, uid } },
              });
              return false;
            }

            await tx.audioLiked.create({ data: { audioId, uid } });
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

    throw new Error("Audio like toggle retry exhausted");
  }

  private isRetryableConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2025", "P2034"].includes(error.code)
    );
  }
}

export const audioLikeRepository = new AudioLikeRepository(prisma);
