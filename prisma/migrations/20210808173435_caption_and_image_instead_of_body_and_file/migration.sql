/*
  Warnings:

  - You are about to drop the column `body` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `file` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "body",
DROP COLUMN "file",
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "image" TEXT;
