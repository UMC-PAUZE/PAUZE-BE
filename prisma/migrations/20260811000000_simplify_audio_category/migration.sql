-- Validate the existing category data before changing the schema.
-- Orphan / unsupported code_name: seed marker then duplicate-key abort.
CREATE TEMPORARY TABLE `_audio_category_invalid_validation` (
    `invalid_marker` TINYINT NOT NULL PRIMARY KEY
);

INSERT INTO `_audio_category_invalid_validation` (`invalid_marker`) VALUES (1);

INSERT INTO `_audio_category_invalid_validation` (`invalid_marker`)
SELECT 1
FROM `audio_category` AS category
LEFT JOIN `audio_code` AS code
    ON code.`code_id` = category.`code_id`
WHERE code.`code_id` IS NULL
   OR code.`code_name` NOT IN ('NATURE_SOUND', 'ASMR', 'NOISE')
LIMIT 1;

DROP TEMPORARY TABLE `_audio_category_invalid_validation`;

-- Duplicate supported codes across categories: UNIQUE abort.
CREATE TEMPORARY TABLE `_audio_category_code_validation` (
    `category_code` ENUM('NATURE_SOUND', 'ASMR', 'NOISE') NOT NULL,
    UNIQUE INDEX `_audio_category_code_validation_code_key` (`category_code`)
);

INSERT INTO `_audio_category_code_validation` (`category_code`)
SELECT code.`code_name`
FROM `audio_category` AS category
INNER JOIN `audio_code` AS code
    ON code.`code_id` = category.`code_id`
WHERE code.`code_name` IN ('NATURE_SOUND', 'ASMR', 'NOISE');

DROP TEMPORARY TABLE `_audio_category_code_validation`;

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
