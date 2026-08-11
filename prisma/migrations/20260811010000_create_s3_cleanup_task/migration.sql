CREATE TABLE `s3_cleanup_task` (
    `cleanup_id` BIGINT NOT NULL AUTO_INCREMENT,
    `object_key` VARCHAR(255) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_error` TEXT NULL,
    `next_attempt_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s3_cleanup_task_object_key_key` (`object_key`),
    INDEX `s3_cleanup_task_next_attempt_at_idx` (`next_attempt_at`),
    PRIMARY KEY (`cleanup_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
