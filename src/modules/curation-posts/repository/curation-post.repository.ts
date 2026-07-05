import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";
import type { CurationPostListQuery } from "../dto/curation-post.dto.js";

export type CurationPostListRow = {
  postId: bigint;
  title: string;
  content: string;
  source: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: Date;
  categoryId: bigint;
  category: {
    name: string;
  };
  likes?: { likesId: bigint }[];
  bookmarks?: { bookmarkId: bigint }[];
};

export type CurationPostFindManyResult = {
  posts: CurationPostListRow[];
  totalElements: number;
};

export class CurationPostRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(query: CurationPostListQuery): Promise<CurationPostFindManyResult> {
    const { categoryId, keyword, page, size, userId } = query;

    const where = {
      isPublished: true,
      ...(categoryId ? { categoryId } : {}),
      ...(keyword
        ? {
            OR: [
              { title: { contains: keyword } },
              { content: { contains: keyword } },
            ],
          }
        : {}),
    };

    const [posts, totalElements] = await Promise.all([
      this.db.curationPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
        include: {
          category: true,
          likes: userId
            ? {
                where: { uid: userId },
                select: { likesId: true },
              }
            : false,
          bookmarks: userId
            ? {
                where: { uid: userId },
                select: { bookmarkId: true },
              }
            : false,
        },
      }),
      this.db.curationPost.count({ where }),
    ]);

    return { posts, totalElements };
  }
}

export const curationPostRepository = new CurationPostRepository(prisma);
