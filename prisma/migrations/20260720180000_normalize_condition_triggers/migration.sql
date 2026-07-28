-- Create the ERD trigger master table.
CREATE TABLE `trigger` (
    `trigger_id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `trigger_code_key`(`code`),
    PRIMARY KEY (`trigger_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create the ERD relation between conditions and triggers.
CREATE TABLE `condition_trigger` (
    `condition_trigger_id` BIGINT NOT NULL AUTO_INCREMENT,
    `condition_id` BIGINT NOT NULL,
    `trigger_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `condition_trigger_condition_id_trigger_id_key`(`condition_id`, `trigger_id`),
    INDEX `condition_trigger_trigger_id_idx`(`trigger_id`),
    PRIMARY KEY (`condition_trigger_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `trigger` (`name`, `code`, `description`, `updated_at`) VALUES
    ('수면 시간', 'SLEEP_DEPRIVATION', NULL, CURRENT_TIMESTAMP(3)),
    ('소음 노출', 'NOISE_EXPOSURE', NULL, CURRENT_TIMESTAMP(3)),
    ('시각 자극 노출', 'VISUAL_STIMULATION', NULL, CURRENT_TIMESTAMP(3)),
    ('사회적 활동량', 'SOCIAL_ISOLATION', NULL, CURRENT_TIMESTAMP(3)),
    ('에너지 수준', 'LOW_ENERGY', NULL, CURRENT_TIMESTAMP(3));

-- Preserve trigger data stored by the previous JSON implementation.
INSERT INTO `condition_trigger` (`condition_id`, `trigger_id`, `updated_at`)
SELECT `condition_id`, `trigger_id`, CURRENT_TIMESTAMP(3)
FROM `condition`
JOIN `trigger`
  ON JSON_CONTAINS(`condition`.`trigger_codes`, JSON_QUOTE(`trigger`.`code`), '$');

UPDATE `condition`
SET `updated_at` = `created_at`
WHERE `updated_at` IS NULL;

ALTER TABLE `condition`
    DROP COLUMN `trigger_codes`,
    MODIFY `updated_at` DATETIME(3) NOT NULL;

ALTER TABLE `condition_trigger`
    ADD CONSTRAINT `condition_trigger_condition_id_fkey`
        FOREIGN KEY (`condition_id`) REFERENCES `condition`(`condition_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `condition_trigger_trigger_id_fkey`
        FOREIGN KEY (`trigger_id`) REFERENCES `trigger`(`trigger_id`)
        ON DELETE CASCADE ON UPDATE CASCADE;
