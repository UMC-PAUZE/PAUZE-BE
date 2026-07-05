-- AlterTable
ALTER TABLE `users` ADD COLUMN `birth` DATE NOT NULL DEFAULT '2000-01-01',
    MODIFY `reminder_alarm_active` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `sensitive_alarm_active` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `curation_alarm_active` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `oauth` (
    `oauth_id` BIGINT NOT NULL AUTO_INCREMENT,
    `uid` CHAR(36) NOT NULL,
    `social_type` ENUM('KAKAO', 'LOCAL') NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `password` TEXT NULL,
    `login_email` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `oauth_login_email_social_type_idx`(`login_email`, `social_type`),
    UNIQUE INDEX `oauth_uid_social_type_key`(`uid`, `social_type`),
    PRIMARY KEY (`oauth_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `term` (
    `term_id` BIGINT NOT NULL AUTO_INCREMENT,
    `term_name` ENUM('NONE') NOT NULL DEFAULT 'NONE',

    PRIMARY KEY (`term_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_term` (
    `user_term_id` BIGINT NOT NULL AUTO_INCREMENT,
    `uid` CHAR(36) NOT NULL,
    `term_id` BIGINT NOT NULL,
    `term_active` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`user_term_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oauth` ADD CONSTRAINT `oauth_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_term` ADD CONSTRAINT `user_term_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_term` ADD CONSTRAINT `user_term_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `term`(`term_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default terms
INSERT INTO `term` (`term_name`) VALUES ('NONE');
