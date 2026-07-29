-- AlterTable
ALTER TABLE `pauze_usage` MODIFY `usage_id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `completedAt` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `completionId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pauze_usage_uid_completionId_key` ON `pauze_usage`(`uid`, `completionId`);
