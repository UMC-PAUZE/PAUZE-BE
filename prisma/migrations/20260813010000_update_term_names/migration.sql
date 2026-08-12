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

-- Drop placeholder NONE consents without rewriting them as TERMS_OF_SERVICE
-- (NONE was a seed placeholder; there is no proof it meant terms-of-service)
DELETE ut FROM `user_term` ut
INNER JOIN `term` t ON ut.`term_id` = t.`term_id`
WHERE t.`term_name` = 'NONE';

DELETE FROM `term` WHERE `term_name` = 'NONE';

-- Drop NONE from enum and remove default
ALTER TABLE `term` MODIFY `term_name` ENUM('TERMS_OF_SERVICE', 'PRIVACY_POLICY') NOT NULL;

-- Enforce one row per term type
CREATE UNIQUE INDEX `term_term_name_key` ON `term`(`term_name`);
