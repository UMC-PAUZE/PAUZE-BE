-- Preserve existing visual content instead of truncating it implicitly.
-- Seed marker 1 first, then deliberately cause a duplicate-key error when a
-- value exceeds the new 100-character limit. The offending rows must be
-- reviewed and shortened explicitly before this migration is retried.
CREATE TEMPORARY TABLE `_visual_content_length_validation` (
    `invalid_marker` TINYINT NOT NULL PRIMARY KEY
);

INSERT INTO `_visual_content_length_validation` (`invalid_marker`) VALUES (1);

INSERT INTO `_visual_content_length_validation` (`invalid_marker`)
SELECT 1
FROM `visual_guide`
WHERE CHAR_LENGTH(`visual_content`) > 100
LIMIT 1;

DROP TEMPORARY TABLE `_visual_content_length_validation`;

-- Audio offline saves are device-local and are no longer persisted by the backend.
DROP TABLE `audio_save`;

-- Align visual_guide with the ERD while preserving existing content values.
ALTER TABLE `visual_guide`
    CHANGE COLUMN `visual_content` `content` VARCHAR(100) NULL,
    MODIFY `visual_title` VARCHAR(50) NOT NULL;
