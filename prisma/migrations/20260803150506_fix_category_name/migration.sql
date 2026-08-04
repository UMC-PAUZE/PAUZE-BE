/*
  Warnings:

  - The values [HSP팁,호흡법,사운드] on the enum `curation_categories_name` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable (widen enum to hold both old and new values while data is remapped)
ALTER TABLE `curation_categories` MODIFY `name` ENUM('HSP팁','연구','호흡법','사운드','진정법','일상팁','기타') NOT NULL;

-- Remap existing rows to their intended category name
UPDATE `curation_categories`
SET `name` = CASE `category_id`
  WHEN 1 THEN '연구'
  WHEN 2 THEN '진정법'
  WHEN 3 THEN '일상팁'
  WHEN 4 THEN '기타'
  ELSE `name`
END;

-- AlterTable (narrow enum down to the final set of values)
ALTER TABLE `curation_categories` MODIFY `name` ENUM('연구', '진정법', '일상팁', '기타') NOT NULL;

-- AlterTable
ALTER TABLE `users` ALTER COLUMN `name` DROP DEFAULT;
