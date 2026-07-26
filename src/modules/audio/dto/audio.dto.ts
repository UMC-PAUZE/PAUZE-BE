export type AudioCategoryCode = "NATURE_SOUND" | "ASMR" | "NOISE";

export interface AudioGuidePublicItem {
  audioId: number;
  audioTitle: string;
  categoryId: number;
  categoryName: string;
  fileUrl: string;
}

export interface AudioGuideAuthenticatedItem extends AudioGuidePublicItem {
  isLiked: boolean;
}

export type AudioGuideListItem =
  | AudioGuidePublicItem
  | AudioGuideAuthenticatedItem;

export interface AudioLikeToggleResult {
  audioId: number;
  isLiked: boolean;
}

export interface AudioSaveResult {
  audioId: number;
  isSaved: boolean;
  audioUrl: string;
}
