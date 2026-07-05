// 카테고리별 청각 오디오 목록 조회 요청 쿼리
export interface GetAudioGuidesByCategoryDto {
    categoryCode: "NATURE_SOUND" | "ASMR" | "NOISE";
}
  
// 청각 오디오 저장/좋아요 요청 쿼리
export interface AudioLikedDto {
    uid: string;
}

// 공통 성공 응답 규격 인터페이스
export interface AudioSuccessResponse<T> {
    isSuccess: true;
    code: "COMMON_200";
    message: string;
    result: T;
}

// 실패 응답 규격 인터페이스
export interface AudioErrorResponse {
    isSuccess: false;
    code: string;
    message: string;
    result: null;
}