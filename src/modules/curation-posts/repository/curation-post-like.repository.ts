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

  async findManyByUid(uid: string, page: number, size: number) {
    const where = { uid, post: { isPublished: true } };

    const [likes, totalElements] = await Promise.all([
      this.db.postLike.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { likesId: "desc" }],
        skip: (page - 1) * size,
        take: size,
        select: {
          likesId: true,
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
              bookmarks: {
                where: { uid },
                select: { bookmarkId: true },
                take: 1,
              },
              _count: {
                select: { likes: true },
              },
            },
          },
        },
      }),
      this.db.postLike.count({ where }),
    ]);

    return { likes, totalElements };
  }
}

export const curationPostLikeRepository = new CurationPostLikeRepository(prisma);
