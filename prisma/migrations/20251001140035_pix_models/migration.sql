-- CreateEnum
CREATE TYPE "public"."PixKeyType" AS ENUM ('CPF', 'EMAIL', 'PHONE', 'EVP');

-- CreateTable
CREATE TABLE "public"."PixKey" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "public"."PixKeyType" NOT NULL,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PixTransfer" (
    "id" TEXT NOT NULL,
    "endToEndId" TEXT NOT NULL,
    "fromAccountId" TEXT,
    "toAccountId" TEXT,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PixTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PixKey_accountId_type_idx" ON "public"."PixKey"("accountId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "PixKey_type_value_key" ON "public"."PixKey"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "PixTransfer_endToEndId_key" ON "public"."PixTransfer"("endToEndId");

-- CreateIndex
CREATE INDEX "PixTransfer_fromAccountId_idx" ON "public"."PixTransfer"("fromAccountId");

-- CreateIndex
CREATE INDEX "PixTransfer_toAccountId_idx" ON "public"."PixTransfer"("toAccountId");

-- AddForeignKey
ALTER TABLE "public"."PixKey" ADD CONSTRAINT "PixKey_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PixTransfer" ADD CONSTRAINT "PixTransfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PixTransfer" ADD CONSTRAINT "PixTransfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
