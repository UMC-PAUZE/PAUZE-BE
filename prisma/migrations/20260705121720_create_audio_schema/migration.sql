-- CreateTable
CREATE TABLE `audio_category` (
    `category_id` BIGINT NOT NULL,
    `category_name` VARCHAR(50) NOT NULL,
    `category_code` ENUM('NATURE_SOUND', 'ASMR', 'NOISE') NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audio_guide` (
    `audio_id` BIGINT NOT NULL,
    `category_id` BIGINT NOT NULL,
    `audio_title` VARCHAR(50) NOT NULL,
    `audio_url` TEXT NOT NULL,
    `audio_key` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`audio_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audio_liked` (
    `liked_id` BIGINT NOT NULL,
    `audio_id` BIGINT NOT NULL,
    `uid` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`liked_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audio_guide` ADD CONSTRAINT `audio_guide_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `audio_category`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audio_liked` ADD CONSTRAINT `audio_liked_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audio_liked` ADD CONSTRAINT `audio_liked_audio_id_fkey` FOREIGN KEY (`audio_id`) REFERENCES `audio_guide`(`audio_id`) ON DELETE CASCADE ON UPDATE CASCADE;
