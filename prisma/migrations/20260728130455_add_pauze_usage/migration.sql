-- CreateTable
CREATE TABLE `pauze_usage` (
    `usage_id` BIGINT NOT NULL AUTO_INCREMENT,
    `uid` CHAR(36) NOT NULL,
    `completion_id` CHAR(36) NOT NULL,
    `completed_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pauze_usage_uid_completed_at_idx`(`uid`, `completed_at`),
    UNIQUE INDEX `pauze_usage_uid_completion_id_key`(`uid`, `completion_id`),
    PRIMARY KEY (`usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pauze_usage` ADD CONSTRAINT `pauze_usage_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;
