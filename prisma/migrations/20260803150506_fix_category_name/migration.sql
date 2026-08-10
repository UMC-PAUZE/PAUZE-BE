/*
  Warnings:

  - The values [HSP팁,호흡법,사운드] on the enum `curation_categories_name` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable (widen enum to hold both old and new values while data is remapped)
ALTER TABLE `curation_categories` MODIFY `name` ENUM('HSP팁','연구','호흡법','사운드','진정법','일상팁','기타') NOT NULL;

-- Remap existing rows from their old value to the new value. Both category_id
-- and the expected pre-migration value are checked together: the old and new
-- value sets overlap (e.g. '연구' is both category_id=2's old value and
-- category_id=1's new value), so matching on value alone would re-corrupt
-- already-migrated rows if this script is retried after a partial run. Once a
-- row has been migrated its `name` no longer matches the WHEN condition for
-- its category_id, so re-running this UPDATE is a safe no-op for it.
UPDATE `curation_categories`
SET `name` = CASE `category_id`
  WHEN 1 THEN '연구'
  WHEN 2 THEN '진정법'
  WHEN 3 THEN '일상팁'
  WHEN 4 THEN '기타'
  ELSE `name`
END
WHERE (`category_id` = 1 AND `name` = 'HSP팁')
   OR (`category_id` = 2 AND `name` = '연구')
   OR (`category_id` = 3 AND `name` = '호흡법')
   OR (`category_id` = 4 AND `name` = '사운드');

-- AlterTable (narrow enum down to the final set of values)
ALTER TABLE `curation_categories` MODIFY `name` ENUM('연구', '진정법', '일상팁', '기타') NOT NULL;

-- AlterTable
ALTER TABLE `users` ALTER COLUMN `name` DROP DEFAULT;
