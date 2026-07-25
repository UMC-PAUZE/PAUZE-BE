-- CreateIndex
CREATE UNIQUE INDEX `curation_posts_category_id_title_key` ON `curation_posts`(`category_id`, `title`);
