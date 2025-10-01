-- CreateTable
CREATE TABLE "public"."InvestmentProduct" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minuteRatePpm" INTEGER NOT NULL,
    "minAmountCents" INTEGER NOT NULL DEFAULT 1000,
    "liquidityMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestmentProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InvestmentPosition" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "principalCents" INTEGER NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "closedAt" TIMESTAMP(3),
    "redeemedCents" INTEGER,

    CONSTRAINT "InvestmentPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestmentProduct_code_key" ON "public"."InvestmentProduct"("code");

-- CreateIndex
CREATE INDEX "InvestmentPosition_accountId_idx" ON "public"."InvestmentPosition"("accountId");

-- CreateIndex
CREATE INDEX "InvestmentPosition_productId_idx" ON "public"."InvestmentPosition"("productId");

-- AddForeignKey
ALTER TABLE "public"."InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InvestmentPosition" ADD CONSTRAINT "InvestmentPosition_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."InvestmentProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
