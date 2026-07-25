export const VISUAL_CODES = {
    GET_VISUAL_GUIDES_SUCCESS: "VISUAL_GUIDE_LIST_SUCCESS",
    GET_VISUAL_GUIDE_FILE_SUCCESS: "VISUAL_GUIDE_FILE_SUCCESS",
    VISUAL_GUIDE_NOT_FOUND: "VISUAL_GUIDE_NOT_FOUND_404",
    BAD_REQUEST: "BAD_REQUEST_400",
  } as const;
  
  export const VISUAL_MESSAGES = {
    GET_VISUAL_GUIDES_SUCCESS: "시각 가이드 리스트 조회에 성공했습니다.",
    GET_VISUAL_GUIDE_FILE_SUCCESS: "시각 가이드 파일 조회에 성공했습니다.",
    VISUAL_GUIDE_NOT_FOUND: "해당 시각 가이드를 찾을 수 없습니다.",
    BAD_REQUEST: "잘못된 요청 파라미터 형식입니다.",
  } as const;
   