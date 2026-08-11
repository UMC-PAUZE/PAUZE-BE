export interface AudioUploadResult {
  /** 등록된 오디오 식별자 */
  audioId: number;
  /** 오디오 제목 */
  audioTitle: string;
  /** 오디오 카테고리 식별자 */
  categoryId: number;
  /** DB에 저장된 오디오 URL */
  audioUrl: string;
  /** UTC 기준 ISO 8601 등록 시각 */
  createdAt: string;
}
