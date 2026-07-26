-- CreateIndex
CREATE UNIQUE INDEX `oauth_social_type_provider_id_key` ON `oauth`(`social_type`, `provider_id`);
