CREATE UNIQUE INDEX `sensitivity_report_uid_report_type_period_start_period_end_key`
    ON `sensitivity_report`(`uid`, `report_type`, `period_start`, `period_end`);

DROP INDEX `sensitivity_report_uid_report_type_period_start_period_end_idx`
    ON `sensitivity_report`;
