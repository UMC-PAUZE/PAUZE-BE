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

  async findManyByUid(uid: string, page: number, size: number) {
    const where = { uid };

    const [bookmarks, totalElements] = await Promise.all([
      this.db.postBookmark.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
        include: {
          post: {
            include: {
              category: true,
            },
          },
        },
      }),
      this.db.postBookmark.count({ where }),
    ]);

    return { bookmarks, totalElements };
  }
}

export const curationPostBookmarkRepository =
  new CurationPostBookmarkRepository(prisma);
