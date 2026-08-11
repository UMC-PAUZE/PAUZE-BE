import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class VisualGuideRepository {
    constructor(private readonly db: PrismaClient) {}

    async findCurrent() {
        return this.db.visualGuide.findFirst({
            orderBy: { visualId: "asc" },
            select: {
                visualId: true,
                visualKey: true,
                visualUrl: true,
            }
        });
    }


    async saveCurrent(params: {
        visualId?: bigint;
        visualKey: string;
        visualTitle: string;
        content: string | null;
        visualUrl: string;
        createdAt: Date;
    }) {
        const { visualId, createdAt, ...data } = params;
        const select = {
            visualId: true,
            visualKey: true,
            visualTitle: true,
            visualUrl: true,
            createdAt: true,
        } as const;

        if (visualId !== undefined) {
            return this.db.visualGuide.update({
                where: { visualId },
                data: { ...data, updatedAt: new Date() },
                select,
            });
        }

        return this.db.visualGuide.create({
            data: { ...data, createdAt },
            select,
        });
    }

    async deleteById(visualId: bigint): Promise<void> {
        await this.db.visualGuide.delete({
            where: { visualId },
            select: {
                visualId: true,
            },
        });
    }
}


export const visualGuideRepository = new VisualGuideRepository(prisma);
