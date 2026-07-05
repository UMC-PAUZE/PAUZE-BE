import { Controller, Get, Post, Patch, Path, Tags, Route, Query } from 'tsoa';
import { AudioService } from '../service/audio.service.js';
import { AudioSuccessResponse } from '../dto/audio.dto.js';

const audioService = new AudioService();

@Tags("AUDIO")
@Route('api/audio-guides')
export class AudioController extends Controller {
    
    // 청각 오디오 목록 조회
    @Get("")
    public async getAllGuides(): Promise<AudioSuccessResponse<any>> {
        const data = await audioService.getAudioGuides();
        return {
            isSuccess: true,
            code: "COMMON_200",
            message: "요청에 성공했습니다.",
            result: data
        };
    }

    // 카테고리별 청각 오디오 목록 조회
    // 💡 해결: 객체 DTO 대신 TSOA가 해석할 수 있게 쿼리 파라미터를 개별 변수로 쪼갰어!
    @Get("categories")
    public async getAudioGuidesByCategory(
        @Query() categoryCode: "NATURE_SOUND" | "ASMR" | "NOISE"
    ): Promise<AudioSuccessResponse<any>> {
        const data = await audioService.getAudioGuidesByCategory(categoryCode);
        return {
            isSuccess: true,
            code: "COMMON_200",
            message: "요청에 성공했습니다.",
            result: data
        };
    }

    // 청각 오디오 저장
    // 💡 해결: @Query() query 대신 @Query() uid로 명학하게 쪼개서 매핑했어!
    @Post("{audioId}/saves")
    public async saveAudioGuides(
        @Path() audioId: string, 
        @Query() uid: string
    ): Promise<AudioSuccessResponse<any>> {
        const data = await audioService.saveAudioGuides(BigInt(audioId), uid); 
        return {
            isSuccess: true,
            code: "COMMON_200",
            message: "요청에 성공했습니다.",
            result: data
        };
    }

    // 청각 오디오 좋아요(토글)
    // 💡 해결: 여기도 uid를 개별 스트링 쿼리로 받도록 수정 완료!
    @Patch("{audioId}/likes") 
    public async toggleAudioLike(
        @Path() audioId: string, 
        @Query() uid: string
    ): Promise<AudioSuccessResponse<any>> {
        const data = await audioService.toggleAudioLike(BigInt(audioId), uid); 
        return {
            isSuccess: true,
            code: "COMMON_200",
            message: "요청에 성공했습니다.",
            result: data
        };
    }
}