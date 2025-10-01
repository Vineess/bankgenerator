// src/app/api/invest/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

export async function GET() {
  const products = await prisma.investmentProduct.findMany({
    orderBy: { minuteRatePpm: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      minuteRatePpm: true,
      minAmountCents: true,   // se estiver BIGINT no DB, será serializado
      liquidityMinutes: true,
    },
  });

  return NextResponse.json(bigintsToNumbers({ ok: true, products }));
}
