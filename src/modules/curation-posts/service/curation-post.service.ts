import { AppError } from "../../../common/errors/app.error.js";
import type { CurationCategoryName } from "../../../generated/prisma/client.js";
import type {
  CreateCurationPostRequest,
  CreateCurationPostResult,
  CurationPostBookmarkResult,
  CurationPostDetailResult,
  CurationPostLikeResult,
  CurationPostListQuery,
  CurationPostListResult,
  MyBookmarkListResult,
  MyLikeListResult,
  UpdateCurationPostRequest,
  UpdateCurationPostResult,
} from "../dto/curation-post.dto.js";
import {
  CURATION_POST_CODES,
  CURATION_POST_MESSAGES,
} from "../errors/curation-post.errors.js";
import {
  type CurationPostBookmarkRepository,
  curationPostBookmarkRepository,
} from "../repository/curation-post-bookmark.repository.js";
import {
  type CurationPostLikeRepository,
  curationPostLikeRepository,
} from "../repository/curation-post-like.repository.js";
import {
  type CurationPostRepository,
  curationPostRepository,
} from "../repository/curation-post.repository.js";

const SUMMARY_LENGTH = 50;
const MAX_TITLE_LENGTH = 255;
const MAX_SOURCE_LENGTH = 255;

const CURATION_CATEGORY_NAME_LABELS: Record<CurationCategoryName, string> = {
  RESEARCH: "연구",
  CALMING_METHOD: "진정법",
  DAILY_TIP: "일상팁",
  ETC: "기타",
};

function getCategoryNameLabel(name: CurationCategoryName): string {
  return CURATION_CATEGORY_NAME_LABELS[name];
}

export class CurationPostService {
  constructor(
    private readonly curationPostRepository: CurationPostRepository,
    private readonly curationPostLikeRepository: CurationPostLikeRepository,
    private readonly curationPostBookmarkRepository: CurationPostBookmarkRepository,
  ) {}

  async getCurationPosts(
    query: CurationPostListQuery,
  ): Promise<CurationPostListResult> {
    if (query.categoryId !== undefined) {
      await this.validateCategoryExists(BigInt(query.categoryId));
    }

    const { posts, totalElements } =
      await this.curationPostRepository.findMany(query);

    return {
      content: posts.map((post) => {
        const summary =
          post.content.length > SUMMARY_LENGTH
            ? `${post.content.slice(0, SUMMARY_LENGTH)}...`
            : post.content;

        return {
          postId: Number(post.postId),
          categoryId: Number(post.categoryId),
          categoryName: getCategoryNameLabel(post.category.name),
          title: post.title,
          estimatedReadTime: post.estimatedReadTime,
          summary,
          source: post.source,
          viewCount: post.viewCount,
          likeCount: post._count.likes,
          isLiked: (post.likes?.length ?? 0) > 0,
          isBookmarked: (post.bookmarks?.length ?? 0) > 0,
          createdAt: post.createdAt.toISOString(),
        };
      }),
      page: query.page,
      size: query.size,
      totalElements,
      totalPages: Math.ceil(totalElements / query.size),
    };
  }

  async getCurationPostDetail(
    postId: bigint,
    userId?: string,
    isAdmin = false,
  ): Promise<CurationPostDetailResult> {
    const post = await this.curationPostRepository.findDetailById(
      postId,
      userId,
    );
    if (!post || (!post.isPublished && !isAdmin)) {
      throw new AppError({
        code: CURATION_POST_CODES.CURATION_POST_NOT_FOUND,
        message: CURATION_POST_MESSAGES.CURATION_POST_NOT_FOUND,
        statusCode: 404,
      });
    }

    return {
      postId: Number(post.postId),
      categoryId: Number(post.categoryId),
      categoryName: getCategoryNameLabel(post.category.name),
      title: post.title,
      content: post.content,
      source: post.source,
      viewCount: post.viewCount,
      likeCount: post._count.likes,
      estimatedReadTime: post.estimatedReadTime,
      isPublished: post.isPublished,
      isLiked: (post.likes?.length ?? 0) > 0,
      isBookmarked: (post.bookmarks?.length ?? 0) > 0,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt?.toISOString() ?? null,
    };
  }

  async createPost(
    data: CreateCurationPostRequest,
  ): Promise<CreateCurationPostResult> {
    this.validateCreateRequest(data);
    await this.validateCategoryExists(BigInt(data.categoryId));
    // UX 피드백용 사전 검사입니다. 동시 요청에 대한 최종 방어는 DB의 유니크 제약(categoryId, title)과
    // 아래 create() 결과의 null 체크(P2002 매핑)가 담당합니다.
    await this.validateTitleNotDuplicated(BigInt(data.categoryId), data.title);

    const post = await this.curationPostRepository.create(data);
    if (!post) {
      throw new AppError({
        code: CURATION_POST_CODES.CURATION_POST_TITLE_DUPLICATED,
        message: CURATION_POST_MESSAGES.CURATION_POST_TITLE_DUPLICATED,
        statusCode: 409,
      });
    }

    return {
      postId: Number(post.postId),
      categoryId: Number(post.categoryId),
      title: post.title,
      createdAt: post.createdAt.toISOString(),
    };
  }

  async updatePost(
    postId: bigint,
    data: UpdateCurationPostRequest,
  ): Promise<UpdateCurationPostResult> {
    await this.validatePostExists(postId);
    this.validateUpdateRequest(data);

    if (data.categoryId !== undefined) {
      await this.validateCategoryExists(BigInt(data.categoryId));
    }

    const post = await this.curationPostRepository.update(postId, data);

    return {
      postId: Number(post.postId),
      categoryId: Number(post.categoryId),
      title: post.title,
      updatedAt: post.updatedAt?.toISOString() ?? null,
    };
  }

  async deletePost(postId: bigint): Promise<null> {
    await this.validatePostExists(postId);
    await this.curationPostRepository.delete(postId);
    return null;
  }

  async toggleLike(
    postId: bigint,
    uid: string,
  ): Promise<CurationPostLikeResult> {
    await this.validatePublishedPostExists(postId);

    const existing = await this.curationPostLikeRepository.findByPostIdAndUid(
      postId,
      uid,
    );
    if (existing) {
      const deleted = await this.curationPostLikeRepository.deleteByPostIdAndUid(
        postId,
        uid,
      );
      if (deleted.count === 0) {
        throw new AppError({
          code: CURATION_POST_CODES.LIKE_DELETE_CONFLICT,
          message: CURATION_POST_MESSAGES.LIKE_DELETE_CONFLICT,
          statusCode: 409,
        });
      }
      return {
        postId: Number(postId),
        liked: false,
      };
    }

    const created = await this.curationPostLikeRepository.create(postId, uid);
    if (!created) {
      throw new AppError({
        code: CURATION_POST_CODES.LIKE_CREATE_CONFLICT,
        message: CURATION_POST_MESSAGES.LIKE_CREATE_CONFLICT,
        statusCode: 409,
      });
    }
    return {
      postId: Number(postId),
      liked: true,
    };
  }

  async toggleBookmark(
    postId: bigint,
    uid: string,
  ): Promise<CurationPostBookmarkResult> {
    await this.validatePublishedPostExists(postId);

    const existing = await this.curationPostBookmarkRepository.findByPostIdAndUid(
      postId,
      uid,
    );
    if (existing) {
      const deleted =
        await this.curationPostBookmarkRepository.deleteByPostIdAndUid(
          postId,
          uid,
        );
      if (deleted.count === 0) {
        throw new AppError({
          code: CURATION_POST_CODES.BOOKMARK_DELETE_CONFLICT,
          message: CURATION_POST_MESSAGES.BOOKMARK_DELETE_CONFLICT,
          statusCode: 409,
        });
      }
      return {
        postId: Number(postId),
        bookmarked: false,
      };
    }

    const created = await this.curationPostBookmarkRepository.create(
      postId,
      uid,
    );
    if (!created) {
      throw new AppError({
        code: CURATION_POST_CODES.BOOKMARK_CREATE_CONFLICT,
        message: CURATION_POST_MESSAGES.BOOKMARK_CREATE_CONFLICT,
        statusCode: 409,
      });
    }
    return {
      postId: Number(postId),
      bookmarked: true,
    };
  }

  async getMyBookmarks(
    uid: string,
    page: number,
    size: number,
    keyword?: string,
  ): Promise<MyBookmarkListResult> {
    const { bookmarks, totalElements } =
      await this.curationPostBookmarkRepository.findManyByUid(
        uid,
        page,
        size,
        keyword,
      );

    return {
      content: bookmarks.map((bookmark) => {
        const summary =
          bookmark.post.content.length > SUMMARY_LENGTH
            ? `${bookmark.post.content.slice(0, SUMMARY_LENGTH)}...`
            : bookmark.post.content;

        return {
          bookmarkId: Number(bookmark.bookmarkId),
          postId: Number(bookmark.postId),
          categoryId: Number(bookmark.post.categoryId),
          categoryName: getCategoryNameLabel(bookmark.post.category.name),
          title: bookmark.post.title,
          estimatedReadTime: bookmark.post.estimatedReadTime,
          summary,
          likeCount: bookmark.post._count.likes,
          isLiked: (bookmark.post.likes?.length ?? 0) > 0,
          createdAt: bookmark.createdAt.toISOString(),
        };
      }),
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
  }

  async getMyLikes(
    uid: string,
    page: number,
    size: number,
    keyword?: string,
  ): Promise<MyLikeListResult> {
    const { likes, totalElements } =
      await this.curationPostLikeRepository.findManyByUid(
        uid,
        page,
        size,
        keyword,
      );

    return {
      content: likes.map((like) => {
        const summary =
          like.post.content.length > SUMMARY_LENGTH
            ? `${like.post.content.slice(0, SUMMARY_LENGTH)}...`
            : like.post.content;

        return {
          likesId: Number(like.likesId),
          postId: Number(like.postId),
          categoryId: Number(like.post.categoryId),
          categoryName: getCategoryNameLabel(like.post.category.name),
          title: like.post.title,
          estimatedReadTime: like.post.estimatedReadTime,
          summary,
          likeCount: like.post._count.likes,
          isBookmarked: (like.post.bookmarks?.length ?? 0) > 0,
          createdAt: like.createdAt.toISOString(),
        };
      }),
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
  }

  private async validatePostExists(postId: bigint) {
    const post = await this.curationPostRepository.findById(postId);
    if (!post) {
      throw new AppError({
        code: CURATION_POST_CODES.CURATION_POST_NOT_FOUND,
        message: CURATION_POST_MESSAGES.CURATION_POST_NOT_FOUND,
        statusCode: 404,
      });
    }
  }

  private async validatePublishedPostExists(postId: bigint) {
    const post = await this.curationPostRepository.findById(postId);
    if (!post || !post.isPublished) {
      throw new AppError({
        code: CURATION_POST_CODES.CURATION_POST_NOT_FOUND,
        message: CURATION_POST_MESSAGES.CURATION_POST_NOT_FOUND,
        statusCode: 404,
      });
    }
  }

  private async validateCategoryExists(categoryId: bigint) {
    const category = await this.curationPostRepository.findCategoryById(categoryId);
    if (!category) {
      throw new AppError({
        code: CURATION_POST_CODES.CATEGORY_NOT_FOUND,
        message: CURATION_POST_MESSAGES.CATEGORY_NOT_FOUND,
        statusCode: 404,
      });
    }
  }

  private async validateTitleNotDuplicated(categoryId: bigint, title: string) {
    const existing = await this.curationPostRepository.findByCategoryIdAndTitle(
      categoryId,
      title,
    );
    if (existing) {
      throw new AppError({
        code: CURATION_POST_CODES.CURATION_POST_TITLE_DUPLICATED,
        message: CURATION_POST_MESSAGES.CURATION_POST_TITLE_DUPLICATED,
        statusCode: 409,
      });
    }
  }

  private validateCreateRequest(data: CreateCurationPostRequest) {
    if (!Number.isInteger(data.categoryId) || data.categoryId < 1) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.INVALID_CATEGORY_ID,
        statusCode: 400,
      });
    }

    if (
      typeof data.title !== "string" ||
      !data.title.trim() ||
      data.title.length > MAX_TITLE_LENGTH
    ) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.INVALID_TITLE,
        statusCode: 400,
      });
    }

    if (typeof data.content !== "string" || !data.content.trim()) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.INVALID_CONTENT,
        statusCode: 400,
      });
    }

    if (
      !Number.isInteger(data.estimatedReadTime) ||
      data.estimatedReadTime < 1
    ) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.INVALID_ESTIMATED_READ_TIME,
        statusCode: 400,
      });
    }

    if (
      data.source !== undefined &&
      data.source !== null &&
      (typeof data.source !== "string" ||
        !data.source.trim() ||
        data.source.length > MAX_SOURCE_LENGTH)
    ) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.INVALID_SOURCE,
        statusCode: 400,
      });
    }

    if (
      data.isPublished !== undefined &&
      typeof data.isPublished !== "boolean"
    ) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.INVALID_IS_PUBLISHED,
        statusCode: 400,
      });
    }
  }

  private validateUpdateRequest(data: UpdateCurationPostRequest) {
    const hasUpdateValue = Object.values(data).some(
      (value) => value !== undefined,
    );
    if (!hasUpdateValue) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.EMPTY_UPDATE_REQUEST,
        statusCode: 400,
      });
    }

    if (
      (data.categoryId !== undefined &&
        (!Number.isInteger(data.categoryId) || data.categoryId < 1)) ||
      (data.estimatedReadTime !== undefined &&
        (!Number.isInteger(data.estimatedReadTime) ||
          data.estimatedReadTime < 1)) ||
      data.title?.trim() === "" ||
      data.content?.trim() === "" ||
      (data.title !== undefined && data.title.length > MAX_TITLE_LENGTH) ||
      (data.source !== undefined &&
        data.source !== null &&
        data.source.length > MAX_SOURCE_LENGTH)
    ) {
      throw new AppError({
        code: CURATION_POST_CODES.BAD_REQUEST,
        message: CURATION_POST_MESSAGES.BAD_REQUEST,
        statusCode: 400,
      });
    }
  }
}

export const curationPostService = new CurationPostService(
  curationPostRepository,
  curationPostLikeRepository,
  curationPostBookmarkRepository,
);
