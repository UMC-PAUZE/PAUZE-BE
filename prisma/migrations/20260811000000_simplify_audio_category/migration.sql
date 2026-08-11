-- Validate the existing category data before changing the schema.
-- NULL insertion stops the migration when a category has no matching code or
-- when code_name is not one of the supported enum values. The UNIQUE
-- constraint stops the migration when multiple categories use the same code.
CREATE TEMPORARY TABLE `_audio_category_migration_validation` (
    `category_code` ENUM('NATURE_SOUND', 'ASMR', 'NOISE') NOT NULL,
    UNIQUE INDEX `_audio_category_migration_validation_code_key` (`category_code`)
);

INSERT INTO `_audio_category_migration_validation` (`category_code`)
SELECT CASE
    WHEN code.`code_name` IN ('NATURE_SOUND', 'ASMR', 'NOISE')
        THEN code.`code_name`
    ELSE NULL
END
FROM `audio_category` AS category
LEFT JOIN `audio_code` AS code
    ON code.`code_id` = category.`code_id`;

DROP TEMPORARY TABLE `_audio_category_migration_validation`;

-- Store the stable category code directly on audio_category.
ALTER TABLE `audio_category`
    ADD COLUMN `category_code` ENUM('NATURE_SOUND', 'ASMR', 'NOISE') NULL;

UPDATE `audio_category` AS category
INNER JOIN `audio_code` AS code
    ON code.`code_id` = category.`code_id`
SET category.`category_code` = code.`code_name`;

ALTER TABLE `audio_category`
    MODIFY `category_code` ENUM('NATURE_SOUND', 'ASMR', 'NOISE') NOT NULL;

CREATE UNIQUE INDEX `audio_category_category_code_key`
    ON `audio_category`(`category_code`);

ALTER TABLE `audio_category`
    DROP FOREIGN KEY `audio_category_code_id_fkey`,
    DROP COLUMN `category_name`,
    DROP COLUMN `code_id`;

DROP TABLE `audio_code`;
