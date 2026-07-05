import { PrismaClient, AudioCode } from "../../../generated/prisma";
import { AudioAppError } from "../../../common/middlewares/audio.middleware.js";
import { AUDIO_CODE, AUDIO_MESSAGE } from "../errors/audio.error.js";

const prisma = new PrismaClient();

export class AudioService {
    // 청각 오디오 목록 조회
    public async getAudioGuides(): Promise<any> {
        const audioList = await prisma.audioGuide.findMany({
            include: { category: true },
        });
        
        return audioList.map((audio:any) => ({
            audioId: Number(audio.audioId),
            audioTitle: audio.audioTitle,
            categoryId: Number(audio.categoryId),
            categoryName: audio.category?.categoryName,
            fileUrl: audio.audioUrl,
            isLiked: false
        }));
    }

    // 카테고리별 청각 오디오 목록 조회
    public async getAudioGuidesByCategory(categoryCode: string): Promise<any> {
        const audioList = await prisma.audioGuide.findMany({
            where: { category: { categoryCode } },
            include: { category: true },
        });
        
        // 명세서 예시 기준: 데이터가 없을 때 404 에러를 던지고 싶다면 주석 해제하여 사용
        /*
        if (!audioList || audioList.length === 0) {
            throw new AudioAppError(AUDIO_CODE.AUDIOGUID_NOT_FOUND, AUDIO_MESSAGE.AUDIOGUID_NOT_FOUND, 404);
        }
        */
        
        return audioList.map((audio:any) => ({
            audioId: Number(audio.audioId),
            audioTitle: audio.audioTitle,
            categoryId: Number(audio.categoryId),
            categoryName: audio.category?.categoryName,
            fileUrl: audio.audioUrl,
            isLiked: false
        }));
    }

    // 청각 오디오 저장
    public async saveAudioGuides(audioId: bigint, uid: string): Promise<any> {
        try {
            // 임시 테이블 저장 로직 예시
            // const saveRecord = await prisma.audioSave.create({ data: { audioId, uid } });
            
            return {
                audioId: Number(audioId),
                isSaved: true,
                audioUrl: "https://..."
            };
        } catch (error) {
            // 저장 실패 시 미들웨어로 에러 전파
            throw new AudioAppError(AUDIO_CODE.AUDIO_SAVE_FAILED, AUDIO_MESSAGE.AUDIO_SAVE_FAILED, 500);
        }
    }

    // 청각 오디오 좋아요 표시/삭제(토글)
    public async toggleAudioLike(audioId: bigint, uid: string) {
        const likeRecord = await prisma.audioLiked.findFirst({
            where: { audioId, uid },
        });

        if (likeRecord) {
            await prisma.audioLiked.delete({
                where: { likedId: likeRecord.likedId },
            });
            return { audioId: Number(audioId), isLiked: false };
        }

        const mockLikedId = BigInt(Date.now()); 
        await prisma.audioLiked.create({
            data: {
                likedId: mockLikedId,
                audioId: audioId,
                uid: uid,
                createdAt: new Date(),
            },
        });
        return { audioId: Number(audioId), isLiked: true };
    }
}