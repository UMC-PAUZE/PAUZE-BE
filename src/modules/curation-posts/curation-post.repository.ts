import { prisma } from "../../db.config.js";
import type { CurationPostListQuery } from "./curation-post.dto.js";

export class CurationPostRepository {
  async findMany(query: CurationPostListQuery) {
    const { categoryId, keyword, page, size, userId } = query;
    const curationPost = (prisma as any).curationPost;

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
      curationPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
        include: {
          category: true,
          likes: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
          bookmarks: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
        },
      }),
      curationPost.count({ where }),
    ]);

    return { posts, totalElements };
  }
}
