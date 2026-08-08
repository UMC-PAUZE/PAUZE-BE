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
  isSaved: boolean;
}

export interface AudioLikeToggleResult {
  audioId: number;
  isLiked: boolean;
}

export interface AudioSaveToggleResult {
  audioId: number;
  isSaved: boolean;
  fileUrl: string;
}
