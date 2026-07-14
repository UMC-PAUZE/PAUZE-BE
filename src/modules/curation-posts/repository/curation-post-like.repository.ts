import { prisma } from "../../../db.config.js";

export class CurationPostLikeRepository {
  constructor(private readonly db: typeof prisma) {}

  async findByPostIdAndUid(postId: bigint, uid: string) {
    return this.db.postLike.findFirst({
      where: { postId, uid },
    });
  }

  async create(postId: bigint, uid: string) {
    return this.db.postLike.create({
      data: { postId, uid },
    });
  }

  async delete(likesId: bigint) {
    return this.db.postLike.delete({
      where: { likesId },
    });
  }
}

export const curationPostLikeRepository = new CurationPostLikeRepository(prisma);