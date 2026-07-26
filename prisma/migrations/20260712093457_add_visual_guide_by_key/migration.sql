/*
  Warnings:

  - A unique constraint covering the columns `[visual_key]` on the table `visual_guide` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `visual_guide_visual_key_key` ON `visual_guide`(`visual_key`);
