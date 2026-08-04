-- AlterTable: add name (default for existing rows), unique nickname
ALTER TABLE `users` ADD COLUMN `name` VARCHAR(255) NOT NULL DEFAULT '';

UPDATE `users` SET `name` = `nickname` WHERE `name` = '';

-- Deduplicate nicknames before unique index (keep lexicographically smallest uid)
UPDATE `users` AS u
INNER JOIN (
  SELECT `nickname`, MIN(`uid`) AS `keep_uid`
  FROM `users`
  GROUP BY `nickname`
  HAVING COUNT(*) > 1
) AS d ON u.`nickname` = d.`nickname` AND u.`uid` <> d.`keep_uid`
SET u.`nickname` = CONCAT(
  LEFT(u.`nickname`, 218),
  '_',
  REPLACE(u.`uid`, '-', '')
);

CREATE UNIQUE INDEX `users_nickname_key` ON `users`(`nickname`);
