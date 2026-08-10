-- Align the audio_code primary-key name with the ERD convention.
ALTER TABLE `audio_code`
    CHANGE COLUMN `id` `code_id` INTEGER NOT NULL AUTO_INCREMENT;
