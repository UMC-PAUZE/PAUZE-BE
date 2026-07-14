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

    async findByKey(visualKey: string) {
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