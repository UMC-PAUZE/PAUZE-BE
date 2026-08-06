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
  estimatedReadTime: number;
  summary: string;
  source: string | null;
  viewCount: number;
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

export interface CurationPostDetailResult {
  postId: number;
  categoryId: number;
  categoryName: string;
  title: string;
  content: string;
  source: string | null;
  viewCount: number;
  likeCount: number;
  estimatedReadTime: number;
  isPublished: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface CurationPostListResult {
  content: CurationPostListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CurationPostLikeResult {
  postId: number;
  liked: boolean;
}

export interface CurationPostBookmarkResult {
  postId: number;
  bookmarked: boolean;
}

export interface CreateCurationPostRequest {
  categoryId: number;
  title: string;
  content: string;
  source?: string | null;
  isPublished?: boolean;
  estimatedReadTime: number;
}

export interface CreateCurationPostResult {
  postId: number;
  categoryId: number;
  title: string;
  createdAt: string;
}

export interface UpdateCurationPostRequest {
  categoryId?: number;
  title?: string;
  content?: string;
  source?: string | null;
  isPublished?: boolean;
  estimatedReadTime?: number;
}

export interface UpdateCurationPostResult {
  postId: number;
  categoryId: number;
  title: string;
  updatedAt: string | null;
}

export interface MyBookmarkListItem {
  bookmarkId: number;
  postId: number;
  categoryId: number;
  categoryName: string;
  title: string;
  estimatedReadTime: number;
  summary: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface MyBookmarkListResult {
  content: MyBookmarkListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
