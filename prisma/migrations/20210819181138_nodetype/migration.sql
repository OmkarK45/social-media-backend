-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('User', 'Comment', 'Post');

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "nodeType" "NodeType" NOT NULL DEFAULT E'Comment';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "nodeType" "NodeType" NOT NULL DEFAULT E'Post';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nodeType" "NodeType" NOT NULL DEFAULT E'User';
