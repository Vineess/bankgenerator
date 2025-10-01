-- CreateEnum
CREATE TYPE "public"."CardType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."CardStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'CANCELED');

-- CreateTable
CREATE TABLE "public"."Card" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "public"."CardType" NOT NULL,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "brand" TEXT NOT NULL DEFAULT 'VISA',
    "holderName" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "panToken" TEXT NOT NULL,
    "expMonth" INTEGER NOT NULL,
    "expYear" INTEGER NOT NULL,
    "status" "public"."CardStatus" NOT NULL DEFAULT 'ACTIVE',
    "creditLimit" INTEGER,
    "availableCredit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_accountId_idx" ON "public"."Card"("accountId");

-- CreateIndex
CREATE INDEX "Card_status_idx" ON "public"."Card"("status");

-- CreateIndex
CREATE INDEX "Card_type_idx" ON "public"."Card"("type");

-- AddForeignKey
ALTER TABLE "public"."Card" ADD CONSTRAINT "Card_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
