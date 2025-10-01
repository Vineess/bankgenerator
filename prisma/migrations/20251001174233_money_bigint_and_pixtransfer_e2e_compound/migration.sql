-- AlterTable
ALTER TABLE "public"."Account" ALTER COLUMN "balance" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."Card" ALTER COLUMN "creditLimit" SET DATA TYPE BIGINT,
ALTER COLUMN "availableCredit" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."InvestmentPosition" ALTER COLUMN "principalCents" SET DATA TYPE BIGINT,
ALTER COLUMN "redeemedCents" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."InvestmentProduct" ALTER COLUMN "minAmountCents" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."PixTransfer" ALTER COLUMN "amount" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "public"."Transaction" ALTER COLUMN "amount" SET DATA TYPE BIGINT;
