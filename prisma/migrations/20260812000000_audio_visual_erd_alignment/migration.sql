-- AudioCategoryCode @map 적용 (curation fix_category_name migration 패턴)
ALTER TABLE `audio_category` MODIFY `category_code`
  ENUM('NATURE_SOUND','ASMR','NOISE','자연소리','노이즈') NOT NULL;

UPDATE `audio_category` SET `category_code` = CASE `category_id`
  WHEN 1 THEN '자연소리' WHEN 2 THEN 'ASMR' WHEN 3 THEN '노이즈' ELSE `category_code` END
WHERE (`category_id` = 1 AND `category_code` = 'NATURE_SOUND')
   OR (`category_id` = 2 AND `category_code` = 'ASMR')
   OR (`category_id` = 3 AND `category_code` = 'NOISE');

ALTER TABLE `audio_category` MODIFY `category_code`
  ENUM('자연소리','ASMR','노이즈') NOT NULL;

INSERT INTO `audio_category` (`category_id`, `category_code`, `created_at`) VALUES
  (1, '자연소리', NOW()), (2, 'ASMR', NOW()), (3, '노이즈', NOW())
ON DUPLICATE KEY UPDATE `category_code` = VALUES(`category_code`);

-- audio_key UNIQUE
CREATE UNIQUE INDEX `audio_guide_audio_key_key` ON `audio_guide`(`audio_key`);

-- visual_guide content, visual_title 제거 (최종 ERD: singleton URL/key만 유지)
ALTER TABLE `visual_guide` DROP COLUMN `visual_content`;
ALTER TABLE `visual_guide` DROP COLUMN `visual_title`;
