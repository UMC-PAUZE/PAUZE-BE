export const VISUAL_CODES = {
    GET_VISUAL_GUIDES_SUCCESS: "VISUAL_GUIDE_LIST_SUCCESS",
    GET_VISUAL_GUIDE_FILE_SUCCESS: "VISUAL_GUIDE_FILE_SUCCESS",
    UPLOAD_SUCCESS: "VISUAL_GUIDE_UPLOAD_SUCCESS",
    DELETE_SUCCESS: "VISUAL_GUIDE_DELETE_SUCCESS",
    VISUAL_GUIDE_NOT_FOUND: "VISUAL_GUIDE_NOT_FOUND_404",
    BAD_REQUEST: "BAD_REQUEST_400",
    UPLOAD_FAILED: "VISUAL_GUIDE_UPLOAD_FAILED_500",
    DELETE_FAILED: "VISUAL_GUIDE_DELETE_FAILED_500",
  } as const;

  export const VISUAL_MESSAGES = {
    GET_VISUAL_GUIDES_SUCCESS: "시각 가이드 리스트 조회에 성공했습니다.",
    GET_VISUAL_GUIDE_FILE_SUCCESS: "시각 가이드 파일 조회에 성공했습니다.",
    UPLOAD_SUCCESS: "시각 안정 가이드가 등록되었습니다.",
    DELETE_SUCCESS: "시각 안정 오디오가 삭제되었습니다.",
    VISUAL_GUIDE_NOT_FOUND: "해당 시각 가이드를 찾을 수 없습니다.",
    BAD_REQUEST: "잘못된 요청 파라미터 형식입니다.",
    UPLOAD_FAILED: "시각 안정 가이드 등록에 실패했습니다. 다시 시도해주세요.",
    DELETE_FAILED: "시각 안정 오디오 삭제에 실패했습니다. 다시 시도해주세요.",
  } as const;
