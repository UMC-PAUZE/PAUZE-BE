import type {
  CurationPostListQuery,
  CurationPostListResult,
} from "../dto/curation-post.dto.js";
import {
  type CurationPostRepository,
  curationPostRepository,
} from "../repository/curation-post.repository.js";

const SUMMARY_LENGTH = 50;

export class CurationPostService {
  constructor(private readonly curationPostRepository: CurationPostRepository) {}

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
}

export const curationPostService = new CurationPostService(curationPostRepository);
