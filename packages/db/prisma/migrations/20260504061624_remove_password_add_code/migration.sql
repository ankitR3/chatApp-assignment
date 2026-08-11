/*
  Warnings:

  - You are about to drop the column `password` on the `Room` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "password",
ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Room_code_idx" ON "Room"("code");
