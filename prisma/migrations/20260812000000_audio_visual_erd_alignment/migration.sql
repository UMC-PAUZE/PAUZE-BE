-- AudioCategoryCode @map 적용 (curation fix_category_name migration 패턴)
-- Remap by existing category_code value, not category_id (IDs are not guaranteed).
ALTER TABLE `audio_category` MODIFY `category_code`
  ENUM('NATURE_SOUND','ASMR','NOISE','자연소리','노이즈') NOT NULL;

UPDATE `audio_category` SET `category_code` = CASE `category_code`
  WHEN 'NATURE_SOUND' THEN '자연소리'
  WHEN 'ASMR' THEN 'ASMR'
  WHEN 'NOISE' THEN '노이즈'
  ELSE `category_code`
END
WHERE `category_code` IN ('NATURE_SOUND', 'ASMR', 'NOISE');

ALTER TABLE `audio_category` MODIFY `category_code`
  ENUM('자연소리','ASMR','노이즈') NOT NULL;

-- Seed missing categories by unique category_code (do not overwrite existing rows).
INSERT INTO `audio_category` (`category_id`, `category_code`, `created_at`)
SELECT v.`category_id`, v.`category_code`, NOW()
FROM (
  SELECT 1 AS `category_id`, '자연소리' AS `category_code`
  UNION ALL SELECT 2, 'ASMR'
  UNION ALL SELECT 3, '노이즈'
) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM `audio_category` AS c WHERE c.`category_code` = v.`category_code`
)
AND NOT EXISTS (
  SELECT 1 FROM `audio_category` AS c WHERE c.`category_id` = v.`category_id`
);

-- audio_key UNIQUE
CREATE UNIQUE INDEX `audio_guide_audio_key_key` ON `audio_guide`(`audio_key`);

-- visual_guide content, visual_title 제거 (최종 ERD: singleton URL/key만 유지)
ALTER TABLE `visual_guide` DROP COLUMN `visual_content`;
ALTER TABLE `visual_guide` DROP COLUMN `visual_title`;
