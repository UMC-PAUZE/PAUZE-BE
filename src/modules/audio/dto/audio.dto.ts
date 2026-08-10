export enum AudioCategoryCode {
  NATURE_SOUND = "NATURE_SOUND",
  ASMR = "ASMR",
  NOISE = "NOISE",
}

export interface AudioGuideListItem {
  /** 오디오 가이드 식별자 */
  audioId: number;
  /** 오디오 제목 */
  audioTitle: string;
  /** 카테고리 식별자 */
  categoryId: number;
  /** 화면에 표시할 카테고리 이름 */
  categoryName: string;
  /** 오디오 카테고리 코드 */
  categoryCode: AudioCategoryCode;
  /** 오디오 재생 및 오프라인 다운로드에 사용할 파일 URL */
  fileUrl: string;
  /** 현재 로그인한 사용자의 좋아요 여부. 비로그인 조회에서는 false */
  isLiked: boolean;
}

export interface AudioGuideCursorPage {
  /** 조회된 오디오 목록 */
  content: AudioGuideListItem[];
  /** 다음 페이지 조회에 사용할 커서. 다음 페이지가 없으면 null */
  nextCursor: string | null;
  /** 다음 페이지 존재 여부 */
  hasNext: boolean;
}

export interface AudioCursorPagination {
  cursor?: bigint;
  size: number;
}

export interface AudioLikeToggleResult {
  /** 좋아요 상태를 변경한 오디오 식별자 */
  audioId: number;
  /** 변경 후 좋아요 상태 */
  isLiked: boolean;
}
