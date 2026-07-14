-- Expand each enum so both legacy and current values are valid during backfill.
ALTER TABLE `condition`
    MODIFY `sleep_level` ENUM('LESS_THAN_FOUR', 'FOUR_TO_SIX', 'SIX_TO_EIGHT', 'OVER_EIGHT', 'OVER_8', 'LESS_4') NOT NULL,
    MODIFY `noise_level` ENUM('LOW', 'NORMAL', 'HIGH', 'QUIET', 'UNCOMFORTABLE', 'HARD') NOT NULL,
    MODIFY `visual_level` ENUM('LOW', 'NORMAL', 'HIGH', 'VERY_HIGH') NOT NULL,
    MODIFY `social_level` ENUM('NONE', 'SOME', 'MANY', 'LITTLE', 'ALONE') NOT NULL,
    MODIFY `energy_level` ENUM('LOW', 'NORMAL', 'HIGH', 'ENOUGH', 'NONE') NOT NULL;

-- Backfill legacy values before removing them from the enum definitions.
UPDATE `condition`
SET `sleep_level` = CASE `sleep_level`
    WHEN 'LESS_THAN_FOUR' THEN 'LESS_4'
    WHEN 'OVER_EIGHT' THEN 'OVER_8'
    ELSE `sleep_level`
END;

UPDATE `condition`
SET `noise_level` = CASE `noise_level`
    WHEN 'LOW' THEN 'QUIET'
    WHEN 'HIGH' THEN 'HARD'
    ELSE `noise_level`
END;

UPDATE `condition`
SET `social_level` = CASE `social_level`
    WHEN 'NONE' THEN 'ALONE'
    ELSE `social_level`
END;

UPDATE `condition`
SET `energy_level` = CASE `energy_level`
    WHEN 'HIGH' THEN 'ENOUGH'
    ELSE `energy_level`
END;

-- Remove legacy values after all rows use the current API contract.
ALTER TABLE `condition`
    MODIFY `sleep_level` ENUM('OVER_8', 'SIX_TO_EIGHT', 'FOUR_TO_SIX', 'LESS_4') NOT NULL,
    MODIFY `noise_level` ENUM('QUIET', 'NORMAL', 'UNCOMFORTABLE', 'HARD') NOT NULL,
    MODIFY `visual_level` ENUM('LOW', 'NORMAL', 'HIGH', 'VERY_HIGH') NOT NULL,
    MODIFY `social_level` ENUM('MANY', 'SOME', 'LITTLE', 'ALONE') NOT NULL,
    MODIFY `energy_level` ENUM('ENOUGH', 'NORMAL', 'LOW', 'NONE') NOT NULL;
