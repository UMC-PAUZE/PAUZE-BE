-- AlterTable: add name (default for existing rows), unique nickname
ALTER TABLE `users` ADD COLUMN `name` VARCHAR(255) NOT NULL DEFAULT '';

UPDATE `users` SET `name` = `nickname` WHERE `name` = '';

CREATE UNIQUE INDEX `users_nickname_key` ON `users`(`nickname`);
