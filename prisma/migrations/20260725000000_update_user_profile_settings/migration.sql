-- AlterTable: users profile/settings fields (ERD sync)
ALTER TABLE `users`
  ADD COLUMN `introduction` TEXT NULL,
  ADD COLUMN `breath_guide_active` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `stability_sound_active` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `offline_content_active` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `users` DROP COLUMN `curation_alarm_active`;
