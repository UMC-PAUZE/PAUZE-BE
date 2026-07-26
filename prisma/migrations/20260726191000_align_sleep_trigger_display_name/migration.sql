UPDATE `trigger`
SET
    `name` = '수면 부족',
    `updated_at` = CURRENT_TIMESTAMP(3)
WHERE `code` = 'SLEEP_DEPRIVATION';
