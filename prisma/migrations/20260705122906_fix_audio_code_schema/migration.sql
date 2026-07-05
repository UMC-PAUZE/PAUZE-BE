/*
  Warnings:

  - You are about to drop the column `category_code` on the `audio_category` table. All the data in the column will be lost.
  - Added the required column `code_id` to the `audio_category` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `audio_category` DROP COLUMN `category_code`,
    ADD COLUMN `code_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `audio_code` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code_name` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `audio_code_code_name_key`(`code_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `audio_category` ADD CONSTRAINT `audio_category_code_id_fkey` FOREIGN KEY (`code_id`) REFERENCES `audio_code`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
