export interface VisualGuideFileResponse {
    /** 조회된 시각 안정 가이드의 고유 키 */
    visualKey: string;
    /** 시각 안정 파일 재생 또는 다운로드에 사용할 URL */
    fileUrl: string;
}
