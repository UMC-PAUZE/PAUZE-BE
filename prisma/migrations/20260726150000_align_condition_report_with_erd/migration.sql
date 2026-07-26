-- Align the daily condition table name and trigger codes with the current ERD.
RENAME TABLE `condition` TO `daily_condition`;

UPDATE `trigger`
SET `code` = 'VISUAL_OVERLOAD', `name` = '시각 과부하'
WHERE `code` = 'VISUAL_STIMULATION';

UPDATE `trigger`
SET `code` = 'SOCIAL_FATIGUE', `name` = '사회 피로'
WHERE `code` = 'SOCIAL_ISOLATION';

UPDATE `trigger`
SET `code` = 'ENERGY_DEPLETION', `name` = '에너지 소진'
WHERE `code` = 'LOW_ENERGY';

CREATE TABLE `pauze_usage` (
    `usage_id` BIGINT NOT NULL,
    `uid` CHAR(36) NOT NULL,
    `completedAt` DATETIME(3) NOT NULL,
    `completionId` CHAR(36) NULL,

    INDEX `pauze_usage_uid_completedAt_idx`(`uid`, `completedAt`),
    PRIMARY KEY (`usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `sensitivity_report` (
    `report_id` BIGINT NOT NULL AUTO_INCREMENT,
    `uid` CHAR(36) NOT NULL,
    `report_type` ENUM('WEEKLY', 'MONTHLY') NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `valid_condition_days` INTEGER NOT NULL DEFAULT 0,
    `average_score` DECIMAL(5, 2) NOT NULL,
    `previous_average_score` DECIMAL(5, 2) NULL,
    `score_change` DECIMAL(5, 2) NULL,
    `pauze_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sensitivity_report_uid_report_type_period_start_period_end_idx`
        (`uid`, `report_type`, `period_start`, `period_end`),
    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `report_trigger_rank` (
    `rank_id` BIGINT NOT NULL AUTO_INCREMENT,
    `report_id` BIGINT NOT NULL,
    `trigger_id` BIGINT NOT NULL,
    `rank_order` INTEGER NOT NULL,
    `average_score` DECIMAL(5, 2) NOT NULL,
    `trigger_count` INTEGER NOT NULL,
    `highest_score_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `report_trigger_rank_report_id_trigger_id_key`(`report_id`, `trigger_id`),
    INDEX `report_trigger_rank_trigger_id_idx`(`trigger_id`),
    PRIMARY KEY (`rank_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `report_insight` (
    `insight_id` BIGINT NOT NULL AUTO_INCREMENT,
    `report_id` BIGINT NOT NULL,
    `insight_type` ENUM(
        'HARDEST_DAY',
        'SLEEP_CORRELATION',
        'TOP_TRIGGER',
        'PAUZE_EFFECT',
        'RECOVERY_SPEED',
        'ACCUMULATED_FATIGUE',
        'TRIGGER_COMBINATION',
        'INSUFFICIENT_DATA'
    ) NOT NULL,
    `content` TEXT NOT NULL,
    `display_order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `report_insight_report_id_display_order_idx`(`report_id`, `display_order`),
    PRIMARY KEY (`insight_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `pauze_usage`
    ADD CONSTRAINT `pauze_usage_uid_fkey`
        FOREIGN KEY (`uid`) REFERENCES `users`(`uid`)
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `sensitivity_report`
    ADD CONSTRAINT `sensitivity_report_uid_fkey`
        FOREIGN KEY (`uid`) REFERENCES `users`(`uid`)
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `report_trigger_rank`
    ADD CONSTRAINT `report_trigger_rank_report_id_fkey`
        FOREIGN KEY (`report_id`) REFERENCES `sensitivity_report`(`report_id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `report_trigger_rank_trigger_id_fkey`
        FOREIGN KEY (`trigger_id`) REFERENCES `trigger`(`trigger_id`)
        ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `report_insight`
    ADD CONSTRAINT `report_insight_report_id_fkey`
        FOREIGN KEY (`report_id`) REFERENCES `sensitivity_report`(`report_id`)
        ON DELETE CASCADE ON UPDATE CASCADE;
