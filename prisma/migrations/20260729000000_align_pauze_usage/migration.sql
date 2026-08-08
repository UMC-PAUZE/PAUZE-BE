-- AlterTable
ALTER TABLE `pauze_usage` MODIFY `usage_id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `completionId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pauze_usage_uid_completionId_key` ON `pauze_usage`(`uid`, `completionId`);
