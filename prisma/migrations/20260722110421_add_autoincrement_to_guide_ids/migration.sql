-- DropForeignKey
ALTER TABLE `audio_liked` DROP FOREIGN KEY `audio_liked_audio_id_fkey`;

-- DropForeignKey
ALTER TABLE `audio_save` DROP FOREIGN KEY `audio_save_audio_id_fkey`;

-- AlterTable
ALTER TABLE `audio_guide` MODIFY `audio_id` BIGINT NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `visual_guide` MODIFY `visual_id` BIGINT NOT NULL AUTO_INCREMENT;

-- AddForeignKey
ALTER TABLE `audio_liked` ADD CONSTRAINT `audio_liked_audio_id_fkey` FOREIGN KEY (`audio_id`) REFERENCES `audio_guide`(`audio_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audio_save` ADD CONSTRAINT `audio_save_audio_id_fkey` FOREIGN KEY (`audio_id`) REFERENCES `audio_guide`(`audio_id`) ON DELETE CASCADE ON UPDATE CASCADE;
