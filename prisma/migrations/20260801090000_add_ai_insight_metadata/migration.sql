ALTER TABLE `report_insight`
    ADD COLUMN `generation_source` ENUM('AI', 'TEMPLATE') NOT NULL DEFAULT 'TEMPLATE',
    ADD COLUMN `model_name` VARCHAR(100) NULL,
    ADD COLUMN `prompt_version` VARCHAR(50) NOT NULL DEFAULT 'v1',
    ADD COLUMN `metrics_json` JSON NULL,
    ADD COLUMN `calculation_hash` CHAR(64) NULL,
    ADD COLUMN `generated_at` DATETIME(3) NULL,
    ADD COLUMN `generation_error` VARCHAR(50) NULL;

ALTER TABLE `sensitivity_report`
    ADD COLUMN `source_data_hash` CHAR(64) NULL;

CREATE INDEX `report_insight_calculation_hash_idx`
    ON `report_insight`(`calculation_hash`);
