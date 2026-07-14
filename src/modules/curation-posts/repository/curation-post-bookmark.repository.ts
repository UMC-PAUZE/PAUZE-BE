import { prisma } from "../../../db.config.js";

export class CurationPostBookmarkRepository {
  constructor(private readonly db: typeof prisma) {}

  async findByPostIdAndUid(postId: bigint, uid: string) {
    return this.db.postBookmark.findFirst({
      where: { postId, uid },
    });
  }

  async create(postId: bigint, uid: string) {
    return this.db.postBookmark.create({
      data: { postId, uid },
    });
  }

  async delete(bookmarkId: bigint) {
    return this.db.postBookmark.delete({
      where: { bookmarkId },
    });
  }
}

export const curationPostBookmarkRepository =
  new CurationPostBookmarkRepository(prisma);