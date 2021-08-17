/*
  Warnings:

  - The primary key for the `Bar` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Bar` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Foo` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Foo` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `fooId` on the `Bar` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Bar" DROP CONSTRAINT "Bar_fooId_fkey";

-- AlterTable
ALTER TABLE "Bar" DROP CONSTRAINT "Bar_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "fooId",
ADD COLUMN     "fooId" INTEGER NOT NULL,
ADD PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Foo" DROP CONSTRAINT "Foo_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Bar" ADD FOREIGN KEY ("fooId") REFERENCES "Foo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
