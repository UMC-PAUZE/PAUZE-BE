-- Abort instead of silently choosing one row when legacy data contains more
-- than one Visual guide.
CREATE TEMPORARY TABLE `_visual_singleton_validation` (
    `invalid_marker` TINYINT NOT NULL PRIMARY KEY
);
INSERT INTO `_visual_singleton_validation` (`invalid_marker`) VALUES (1);
INSERT INTO `_visual_singleton_validation` (`invalid_marker`)
SELECT 1 FROM `visual_guide` HAVING COUNT(*) > 1;
DROP TEMPORARY TABLE `_visual_singleton_validation`;

ALTER TABLE `visual_guide`
    ADD COLUMN `singleton_key` INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX `visual_guide_singleton_key_key`
    ON `visual_guide` (`singleton_key`);

CREATE TABLE `visual_guide_lock` (
    `lock_id` INTEGER NOT NULL,
    PRIMARY KEY (`lock_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO `visual_guide_lock` (`lock_id`) VALUES (1);
