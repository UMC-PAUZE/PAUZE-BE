/*
  Warnings:

  - The values [HSP팁,호흡법,사운드] on the enum `curation_categories_name` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable (widen enum to hold both old and new values while data is remapped)
ALTER TABLE `curation_categories` MODIFY `name` ENUM('HSP팁','연구','호흡법','사운드','진정법','일상팁','기타') NOT NULL;

-- Remap existing rows from their old value to the new value (value-based, not
-- tied to category_id, so it is unaffected by how many category rows exist)
UPDATE `curation_categories`
SET `name` = CASE `name`
  WHEN 'HSP팁' THEN '연구'
  WHEN '연구' THEN '진정법'
  WHEN '호흡법' THEN '일상팁'
  WHEN '사운드' THEN '기타'
  ELSE `name`
END
WHERE `name` IN ('HSP팁', '연구', '호흡법', '사운드');

-- AlterTable (narrow enum down to the final set of values)
ALTER TABLE `curation_categories` MODIFY `name` ENUM('연구', '진정법', '일상팁', '기타') NOT NULL;

-- AlterTable
ALTER TABLE `users` ALTER COLUMN `name` DROP DEFAULT;
