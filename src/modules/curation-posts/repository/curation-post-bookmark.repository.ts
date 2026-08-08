import { prisma } from "../../../db.config.js";

export class CurationPostBookmarkRepository {
  constructor(private readonly db: typeof prisma) {}

  async findByPostIdAndUid(postId: bigint, uid: string) {
    return this.db.postBookmark.findFirst({
      where: { postId, uid },
    });
  }

  async create(postId: bigint, uid: string) {
    try {
      return await this.db.postBookmark.create({
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
    return this.db.postBookmark.deleteMany({
      where: { postId, uid },
    });
  }

  async findManyByUid(uid: string, page: number, size: number) {
    const where = { uid, post: { isPublished: true } };

    const [bookmarks, totalElements] = await Promise.all([
      this.db.postBookmark.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { bookmarkId: "desc" }],
        skip: (page - 1) * size,
        take: size,
        select: {
          bookmarkId: true,
          postId: true,
          createdAt: true,
          post: {
            select: {
              categoryId: true,
              title: true,
              content: true,
              estimatedReadTime: true,
              category: {
                select: {
                  name: true,
                },
              },
              likes: {
                where: { uid },
                select: { likesId: true },
                take: 1,
              },
              _count: {
                select: { likes: true },
              },
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
