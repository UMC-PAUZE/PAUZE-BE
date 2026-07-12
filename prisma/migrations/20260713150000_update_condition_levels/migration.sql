-- AlterTable
ALTER TABLE `condition`
    MODIFY `sleep_level` ENUM('OVER_8', 'SIX_TO_EIGHT', 'FOUR_TO_SIX', 'LESS_4') NOT NULL,
    MODIFY `noise_level` ENUM('QUIET', 'NORMAL', 'UNCOMFORTABLE', 'HARD') NOT NULL,
    MODIFY `visual_level` ENUM('LOW', 'NORMAL', 'HIGH', 'VERY_HIGH') NOT NULL,
    MODIFY `social_level` ENUM('MANY', 'SOME', 'LITTLE', 'ALONE') NOT NULL,
    MODIFY `energy_level` ENUM('ENOUGH', 'NORMAL', 'LOW', 'NONE') NOT NULL;