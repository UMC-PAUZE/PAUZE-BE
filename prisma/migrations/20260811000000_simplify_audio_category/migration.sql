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
