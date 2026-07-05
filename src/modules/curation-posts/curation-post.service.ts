import type {
  ApiResponse,
  CurationPostListQuery,
  CurationPostListResult,
} from "./curation-post.dto.js";
import { successResponse } from "./curation-post.dto.js";
import { CurationPostRepository } from "./curation-post.repository.js";

const SUMMARY_LENGTH = 50;

export class CurationPostService {
  constructor(
    private readonly curationPostRepository = new CurationPostRepository(),
  ) {}

  async getCurationPosts(
    query: CurationPostListQuery,
  ): Promise<ApiResponse<CurationPostListResult>> {
    const { posts, totalElements } =
      await this.curationPostRepository.findMany(query);

    return successResponse("게시글 목록 조회 성공", {
      content: posts.map((post) => {
        const summary =
          post.content.length > SUMMARY_LENGTH
            ? `${post.content.slice(0, SUMMARY_LENGTH)}...`
            : post.content;

        return {
          postId: post.id,
          categoryId: post.categoryId,
          categoryName: post.category.name,
          title: post.title,
          summary,
          source: post.source,
          thumbnailUrl: post.thumbnailUrl,
          viewCount: post.viewCount,
          isLiked: "likes" in post ? post.likes.length > 0 : false,
          isBookmarked: "bookmarks" in post ? post.bookmarks.length > 0 : false,
          createdAt: post.createdAt.toISOString(),
        };
      }),
      page: query.page,
      size: query.size,
      totalElements,
      totalPages: Math.ceil(totalElements / query.size),
    });
  }
}
