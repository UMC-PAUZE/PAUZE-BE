-- CreateTable
CREATE TABLE `visual_guide` (
    `visual_id` BIGINT NOT NULL,
    `visual_title` VARCHAR(191) NOT NULL,
    `visual_content` TEXT NOT NULL,
    `visual_url` TEXT NOT NULL,
    `visual_key` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`visual_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
