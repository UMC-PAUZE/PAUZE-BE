-- Claim lease for concurrent S3 cleanup workers.
ALTER TABLE `s3_cleanup_task`
    ADD COLUMN `locked_until` DATETIME(3) NULL,
    ADD COLUMN `lock_token` CHAR(36) NULL;

CREATE INDEX `s3_cleanup_task_claim_idx`
    ON `s3_cleanup_task`(`next_attempt_at`, `locked_until`);

-- Restrict visual_guide.singleton_key to the single allowed value.
ALTER TABLE `visual_guide`
    ADD CONSTRAINT `visual_guide_singleton_key_check`
    CHECK (`singleton_key` = 1);
