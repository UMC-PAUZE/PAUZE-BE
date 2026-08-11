import { prisma } from "../../../db.config.js";
import type { PrismaClient } from "../../../generated/prisma/client.js";

export class VisualGuideRepository {
    constructor(private readonly db: PrismaClient) {}

    async withMutationLock<T>(
        operation: (repository: VisualGuideRepository) => Promise<T>,
    ): Promise<T> {
        return this.db.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT lock_id FROM visual_guide_lock WHERE lock_id = 1 FOR UPDATE`;
            return operation(new VisualGuideRepository(tx as unknown as PrismaClient));
        });
    }

    async findCurrent() {
        return this.db.visualGuide.findUnique({
            where: { singletonKey: 1 },
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

        return this.db.visualGuide.upsert({
            where: { singletonKey: 1 },
            update: { ...data, updatedAt: new Date() },
            create: { ...data, singletonKey: 1, createdAt },
            select,
        });
    }

    async enqueueCleanup(objectKey: string): Promise<void> {
        await this.db.s3CleanupTask.upsert({
            where: { objectKey },
            update: {},
            create: { objectKey },
        });
    }

    async deleteIfCurrent(visualId: bigint, visualKey: string): Promise<boolean> {
        const result = await this.db.visualGuide.deleteMany({
            where: { visualId, visualKey, singletonKey: 1 },
        });
        return result.count === 1;
    }
}


export const visualGuideRepository = new VisualGuideRepository(prisma);
