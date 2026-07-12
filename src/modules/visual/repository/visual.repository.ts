import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export type VisualGuideListRow = {
  visualId: bigint;
  visualTitle: string;
  visualContent: string;
  visualUrl: string;
};

export class VisualGuideRepository {
    constructor(private readonly db: PrismaClient) {}

    async findMany(): Promise<VisualGuideListRow[]> { // 목록 조회
        return this.db.visualGuide.findMany({
            select: {
                visualId: true,
                visualTitle: true,
                visualContent: true,
                visualUrl: true,
            },
        });
    }

    async findByKey(visualKey: string) { // 키 값으로 해당하는 시각 가이드 파일(오디오) 가져오기
        return this.db.visualGuide.findUnique({
            where: { visualKey },
            select: {
                visualKey: true,
                visualUrl: true,
            }
        });
    }
}


export const visualGuideRepository = new VisualGuideRepository(prisma);