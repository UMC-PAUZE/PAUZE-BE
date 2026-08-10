-- Audio offline saves are device-local and are no longer persisted by the backend.
DROP TABLE `audio_save`;

-- Align visual_guide with the ERD while preserving existing content values.
ALTER TABLE `visual_guide`
    CHANGE COLUMN `visual_content` `content` VARCHAR(100) NULL,
    MODIFY `visual_title` VARCHAR(50) NOT NULL;
