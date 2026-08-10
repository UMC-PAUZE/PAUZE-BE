export enum AudioCategoryCode {
  NATURE_SOUND = "NATURE_SOUND",
  ASMR = "ASMR",
  NOISE = "NOISE",
}

export interface AudioGuideListItem {
  audioId: number;
  audioTitle: string;
  categoryId: number;
  categoryName: string;
  categoryCode: AudioCategoryCode;
  fileUrl: string;
  isLiked: boolean;
}

export interface AudioGuideCursorPage {
  content: AudioGuideListItem[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface AudioCursorPagination {
  cursor?: bigint;
  size: number;
}

export interface AudioLikeToggleResult {
  audioId: number;
  isLiked: boolean;
}
