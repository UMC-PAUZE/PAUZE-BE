import { AppError } from "../../../common/errors/app.error.js";
import type {
  CurationPostBookmarkResult,
  CurationPostLikeResult,
  CurationPostListQuery,
  CurationPostListResult,
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

export class CurationPostService {
  constructor(
    private readonly curationPostRepository: CurationPostRepository,
    private readonly curationPostLikeRepository: CurationPostLikeRepository,
    private readonly curationPostBookmarkRepository: CurationPostBookmarkRepository,
  ) {}

  async getCurationPosts(
    query: CurationPostListQuery,
  ): Promise<CurationPostListResult> {
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
          categoryName: post.category.name,
          title: post.title,
          estimatedReadTime: post.estimatedReadTime,
          summary,
          source: post.source,
          thumbnailUrl: post.thumbnailUrl,
          viewCount: post.viewCount,
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

  async createLike(
    postId: bigint,
    uid: string,
  ): Promise<CurationPostLikeResult> {
    await this.validatePostExists(postId);

    const like = await this.curationPostLikeRepository.findByPostIdAndUid(
      postId,
      uid,
    );
    if (like) {
      throw new AppError({
        code: CURATION_POST_CODES.ALREADY_LIKED,
        message: CURATION_POST_MESSAGES.ALREADY_LIKED,
        statusCode: 409,
      });
    }

    await this.curationPostLikeRepository.create(postId, uid);
    return {
      postId: Number(postId),
      liked: true,
    };
  }

  async deleteLike(
    postId: bigint,
    uid: string,
  ): Promise<CurationPostLikeResult> {
    await this.validatePostExists(postId);

    const like = await this.curationPostLikeRepository.findByPostIdAndUid(
      postId,
      uid,
    );
    if (!like) {
      throw new AppError({
        code: CURATION_POST_CODES.LIKE_NOT_FOUND,
        message: CURATION_POST_MESSAGES.LIKE_NOT_FOUND,
        statusCode: 404,
      });
    }

    await this.curationPostLikeRepository.delete(like.likesId);
    return {
      postId: Number(postId),
      liked: false,
    };
  }

  async createBookmark(
    postId: bigint,
    uid: string,
  ): Promise<CurationPostBookmarkResult> {
    await this.validatePostExists(postId);

    const bookmark =
      await this.curationPostBookmarkRepository.findByPostIdAndUid(postId, uid);
    if (bookmark) {
      throw new AppError({
        code: CURATION_POST_CODES.ALREADY_BOOKMARKED,
        message: CURATION_POST_MESSAGES.ALREADY_BOOKMARKED,
        statusCode: 409,
      });
    }

    await this.curationPostBookmarkRepository.create(postId, uid);
    return {
      postId: Number(postId),
      bookmarked: true,
    };
  }

  async deleteBookmark(
    postId: bigint,
    uid: string,
  ): Promise<CurationPostBookmarkResult> {
    await this.validatePostExists(postId);

    const bookmark =
      await this.curationPostBookmarkRepository.findByPostIdAndUid(postId, uid);
    if (!bookmark) {
      throw new AppError({
        code: CURATION_POST_CODES.BOOKMARK_NOT_FOUND,
        message: CURATION_POST_MESSAGES.BOOKMARK_NOT_FOUND,
        statusCode: 404,
      });
    }

    await this.curationPostBookmarkRepository.delete(bookmark.bookmarkId);
    return {
      postId: Number(postId),
      bookmarked: false,
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
}

export const curationPostService = new CurationPostService(
  curationPostRepository,
  curationPostLikeRepository,
  curationPostBookmarkRepository,
);
