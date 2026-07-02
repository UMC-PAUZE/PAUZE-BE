-- CreateTable
CREATE TABLE `users` (
    `uid` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(255) NOT NULL,
    `profile_image_url` TEXT NULL,
    `profile_s3_key` VARCHAR(255) NULL,
    `reminder_alarm_active` BOOLEAN NOT NULL DEFAULT false,
    `sensitive_alarm_active` BOOLEAN NOT NULL DEFAULT false,
    `curation_alarm_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `push_token` VARCHAR(255) NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
