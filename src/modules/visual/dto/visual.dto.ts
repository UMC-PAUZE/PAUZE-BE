export interface VisualGuideFileResponse {
    /** 시각 안정 파일 재생 또는 다운로드에 사용할 URL */
    visualUrl: string;
}

export interface VisualGuideUploadResult {
    /** 등록된 시각 안정 가이드 식별자 */
    visualId: number;
    /** 시각 안정 가이드 제목 */
    visualTitle: string;
    /** DB에 저장된 시각 안정 파일 URL */
    visualUrl: string;
    /** UTC 기준 ISO 8601 등록 시각 */
    createdAt: string;
}

export interface VisualGuideDeleteResult {
    /** 삭제된 시각 안정 가이드 식별자 */
    visualId: number;
}
