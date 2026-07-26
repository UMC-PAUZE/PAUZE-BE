-- CreateIndex
CREATE UNIQUE INDEX `post_likes_post_id_uid_key` ON `post_likes`(`post_id`, `uid`);

-- CreateIndex
CREATE UNIQUE INDEX `post_bookmarks_post_id_uid_key` ON `post_bookmarks`(`post_id`, `uid`);
