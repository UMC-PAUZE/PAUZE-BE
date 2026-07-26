-- CreateTable
CREATE TABLE `condition` (
    `condition_id` BIGINT NOT NULL AUTO_INCREMENT,
    `uid` CHAR(36) NOT NULL,
    `sleep_level` ENUM('LESS_THAN_FOUR', 'FOUR_TO_SIX', 'SIX_TO_EIGHT', 'OVER_EIGHT') NOT NULL,
    `noise_level` ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL,
    `visual_level` ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL,
    `social_level` ENUM('NONE', 'SOME', 'MANY') NOT NULL,
    `energy_level` ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL,
    `sensitivity_score` INTEGER NOT NULL,
    `sensitivity_level` ENUM('LOW', 'NORMAL', 'HIGH') NOT NULL,
    `trigger_codes` JSON NOT NULL,
    `condition_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `condition_uid_condition_date_key`(`uid`, `condition_date`),
    PRIMARY KEY (`condition_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `condition` ADD CONSTRAINT `condition_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;