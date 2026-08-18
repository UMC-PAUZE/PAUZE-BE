export interface BreatheGuideFileResponse {
  /** 호흡 가이드 파일 재생 또는 다운로드에 사용할 URL */
  breatheUrl: string;
}

export interface BreatheGuideUploadResult {
  /** 등록된 호흡 가이드 식별자 */
  breatheId: number;
  /** DB에 저장된 호흡 가이드 파일 URL */
  breatheUrl: string;
  /** UTC 기준 ISO 8601 등록 시각 */
  createdAt: string;
}
