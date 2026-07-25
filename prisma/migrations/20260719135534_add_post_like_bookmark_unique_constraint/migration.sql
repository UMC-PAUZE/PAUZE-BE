-- CreateIndex
CREATE INDEX `post_bookmarks_post_id_fkey` ON `post_bookmarks`(`post_id`);

-- CreateIndex
CREATE INDEX `post_likes_post_id_fkey` ON `post_likes`(`post_id`);
