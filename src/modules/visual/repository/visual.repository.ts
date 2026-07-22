import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class VisualGuideRepository {
    constructor(private readonly db: PrismaClient) {}

    async findByKey(visualKey: string) {
        return this.db.visualGuide.findFirst({
            where: { visualKey },
            select: {
                visualKey: true,
                visualUrl: true,
            }
        });
    }
}


export const visualGuideRepository = new VisualGuideRepository(prisma);
