CREATE TABLE `breathe_guide` (
    `breathe_id` BIGINT NOT NULL AUTO_INCREMENT,
    `singleton_key` INTEGER NOT NULL DEFAULT 1,
    `breathe_url` TEXT NOT NULL,
    `breathe_key` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `breathe_guide_singleton_key_key`(`singleton_key`),
    UNIQUE INDEX `breathe_guide_breathe_key_key`(`breathe_key`),
    PRIMARY KEY (`breathe_id`),
    CONSTRAINT `breathe_guide_singleton_key_check` CHECK (`singleton_key` = 1)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `breathe_guide_lock` (
    `lock_id` INTEGER NOT NULL,
    PRIMARY KEY (`lock_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `breathe_guide_lock` (`lock_id`) VALUES (1);
