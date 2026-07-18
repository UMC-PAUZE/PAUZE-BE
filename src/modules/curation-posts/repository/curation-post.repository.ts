import { prisma } from "../../../db.config.js";
import type {
  CreateCurationPostRequest,
  CurationPostListQuery,
  UpdateCurationPostRequest,
} from "../dto/curation-post.dto.js";

export type CurationPostListRow = {
  postId: bigint;
  title: string;
  content: string;
  source: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  estimatedReadTime: number;
  createdAt: Date;
  categoryId: bigint;
  category: {
    name: string;
  };
  likes?: { likesId: bigint }[];
  bookmarks?: { bookmarkId: bigint }[];
  _count: {
    likes: number;
  };
};

export type CurationPostDetailRow = CurationPostListRow & {
  isPublished: boolean;
  updatedAt: Date | null;
};

export type CurationPostFindManyResult = {
  posts: CurationPostListRow[];
  totalElements: number;
};

export class CurationPostRepository {
  constructor(private readonly db: typeof prisma) {}

  async findById(postId: bigint) {
    return this.db.curationPost.findUnique({
      where: { postId },
      select: { postId: true, isPublished: true },
    });
  }

  async findCategoryById(categoryId: bigint) {
    return this.db.curationCategory.findUnique({
      where: { categoryId },
      select: { categoryId: true },
    });
  }

  async findDetailById(
    postId: bigint,
    userId?: string,
  ): Promise<CurationPostDetailRow | null> {
    return this.db.curationPost.findUnique({
      where: { postId },
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
        _count: {
          select: { likes: true },
        },
      },
    });
  }

  async findMany(query: CurationPostListQuery): Promise<CurationPostFindManyResult> {
    const { categoryId, keyword, page, size, userId } = query;

    const where = {
      isPublished: true,
      ...(categoryId ? { categoryId: BigInt(categoryId) } : {}),
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
          _count: {
            select: { likes: true },
          },
        },
      }),
      this.db.curationPost.count({ where }),
    ]);

    return { posts, totalElements };
  }

  async create(data: CreateCurationPostRequest) {
    return this.db.curationPost.create({
      data: {
        title: data.title,
        content: data.content,
        source: data.source,
        thumbnailUrl: data.thumbnailUrl,
        isPublished: data.isPublished ?? true,
        estimatedReadTime: data.estimatedReadTime,
        category: {
          connect: { categoryId: BigInt(data.categoryId) },
        },
      },
    });
  }

  async update(postId: bigint, data: UpdateCurationPostRequest) {
    return this.db.curationPost.update({
      where: { postId },
      data: {
        ...(data.categoryId !== undefined
          ? {
              category: {
                connect: { categoryId: BigInt(data.categoryId) },
              },
            }
          : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.source !== undefined ? { source: data.source } : {}),
        ...(data.thumbnailUrl !== undefined
          ? { thumbnailUrl: data.thumbnailUrl }
          : {}),
        ...(data.isPublished !== undefined
          ? { isPublished: data.isPublished }
          : {}),
        ...(data.estimatedReadTime !== undefined
          ? { estimatedReadTime: data.estimatedReadTime }
          : {}),
      },
    });
  }

  async delete(postId: bigint) {
    return this.db.curationPost.delete({
      where: { postId },
    });
  }
}

export const curationPostRepository = new CurationPostRepository(prisma);
