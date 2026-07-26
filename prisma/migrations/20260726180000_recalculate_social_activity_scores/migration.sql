UPDATE `daily_condition`
SET `sensitivity_score` = `sensitivity_score` +
    CASE `social_level`
        WHEN 'ALONE' THEN -20
        WHEN 'LITTLE' THEN -6
        WHEN 'SOME' THEN 6
        WHEN 'MANY' THEN 20
    END;

UPDATE `daily_condition`
SET `sensitivity_level` =
    CASE
        WHEN `sensitivity_score` <= 40 THEN 'LOW'
        WHEN `sensitivity_score` <= 65 THEN 'NORMAL'
        ELSE 'HIGH'
    END;

DELETE `condition_trigger`
FROM `condition_trigger`
INNER JOIN `trigger`
    ON `trigger`.`trigger_id` = `condition_trigger`.`trigger_id`
WHERE `trigger`.`code` = 'SOCIAL_FATIGUE';

INSERT INTO `condition_trigger`
    (`condition_id`, `trigger_id`, `created_at`, `updated_at`)
SELECT
    `daily_condition`.`condition_id`,
    `trigger`.`trigger_id`,
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
FROM `daily_condition`
INNER JOIN `trigger`
    ON `trigger`.`code` = 'SOCIAL_FATIGUE'
WHERE `daily_condition`.`social_level` IN ('SOME', 'MANY');
