-- Expand enum to include real term types (keep NONE temporarily for data migration)
ALTER TABLE `term` MODIFY `term_name` ENUM('NONE', 'TERMS_OF_SERVICE', 'PRIVACY_POLICY') NOT NULL DEFAULT 'NONE';

-- Seed required terms
INSERT INTO `term` (`term_name`)
SELECT 'TERMS_OF_SERVICE' FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `term` WHERE `term_name` = 'TERMS_OF_SERVICE'
);

INSERT INTO `term` (`term_name`)
SELECT 'PRIVACY_POLICY' FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `term` WHERE `term_name` = 'PRIVACY_POLICY'
);

-- Remap any user_term rows that pointed at NONE → TERMS_OF_SERVICE
UPDATE `user_term` ut
INNER JOIN `term` old_t ON ut.`term_id` = old_t.`term_id` AND old_t.`term_name` = 'NONE'
INNER JOIN `term` new_t ON new_t.`term_name` = 'TERMS_OF_SERVICE'
SET ut.`term_id` = new_t.`term_id`;

-- Remove placeholder NONE term
DELETE FROM `term` WHERE `term_name` = 'NONE';

-- Drop NONE from enum and remove default
ALTER TABLE `term` MODIFY `term_name` ENUM('TERMS_OF_SERVICE', 'PRIVACY_POLICY') NOT NULL;

-- Enforce one row per term type
CREATE UNIQUE INDEX `term_term_name_key` ON `term`(`term_name`);
