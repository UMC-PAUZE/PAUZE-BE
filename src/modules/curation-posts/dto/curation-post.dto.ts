export interface CurationPostListQuery {
  categoryId?: number;
  keyword?: string;
  page: number;
  size: number;
  userId?: string;
}

export interface CurationPostListItem {
  postId: number;
  categoryId: number;
  categoryName: string;
  title: string;
  summary: string;
  source: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

export interface CurationPostListResult {
  content: CurationPostListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}