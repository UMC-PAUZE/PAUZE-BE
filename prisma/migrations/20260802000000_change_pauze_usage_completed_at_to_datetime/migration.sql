-- Preserve the wall-clock values already stored in completedAt while aligning
-- the database column type with Prisma's @db.DateTime(3) declaration.
ALTER TABLE `pauze_usage`
    MODIFY `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
