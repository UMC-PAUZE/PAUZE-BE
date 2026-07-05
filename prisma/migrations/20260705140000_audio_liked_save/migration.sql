-- DropForeignKey
ALTER TABLE `audio_liked` DROP FOREIGN KEY `audio_liked_uid_fkey`;
ALTER TABLE `audio_liked` DROP FOREIGN KEY `audio_liked_audio_id_fkey`;

-- AlterTable
ALTER TABLE `audio_liked` MODIFY `liked_id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `uid` CHAR(36) NOT NULL,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE `audio_liked` ADD CONSTRAINT `audio_liked_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audio_liked` ADD CONSTRAINT `audio_liked_audio_id_fkey` FOREIGN KEY (`audio_id`) REFERENCES `audio_guide`(`audio_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX `audio_liked_audio_id_uid_key` ON `audio_liked`(`audio_id`, `uid`);

-- CreateTable
CREATE TABLE `audio_save` (
    `save_id` BIGINT NOT NULL AUTO_INCREMENT,
    `audio_id` BIGINT NOT NULL,
    `uid` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `audio_save_audio_id_uid_key`(`audio_id`, `uid`),
    PRIMARY KEY (`save_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audio_save` ADD CONSTRAINT `audio_save_audio_id_fkey` FOREIGN KEY (`audio_id`) REFERENCES `audio_guide`(`audio_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audio_save` ADD CONSTRAINT `audio_save_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;
