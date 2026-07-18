import { prisma } from "../../../db.config.js";

export class CurationPostLikeRepository {
  constructor(private readonly db: typeof prisma) {}

  async findByPostIdAndUid(postId: bigint, uid: string) {
    return this.db.postLike.findFirst({
      where: { postId, uid },
    });
  }

  async create(postId: bigint, uid: string) {
    try {
      return await this.db.postLike.create({
        data: { postId, uid },
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        return null;
      }

      throw error;
    }
  }

  async deleteByPostIdAndUid(postId: bigint, uid: string) {
    return this.db.postLike.deleteMany({
      where: { postId, uid },
    });
  }
}

export const curationPostLikeRepository = new CurationPostLikeRepository(prisma);
