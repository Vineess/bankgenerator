/*
  Warnings:

  - A unique constraint covering the columns `[endToEndId,direction]` on the table `PixTransfer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."PixTransfer_endToEndId_key";

-- CreateIndex
CREATE INDEX "PixTransfer_endToEndId_idx" ON "public"."PixTransfer"("endToEndId");

-- CreateIndex
CREATE UNIQUE INDEX "PixTransfer_endToEndId_direction_key" ON "public"."PixTransfer"("endToEndId", "direction");
