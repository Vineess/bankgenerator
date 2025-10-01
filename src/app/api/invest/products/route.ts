import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const products = await prisma.investmentProduct.findMany({
    orderBy: { minuteRatePpm: "asc" },
    select: {
      id: true, code: true, name: true, description: true,
      minuteRatePpm: true, minAmountCents: true, liquidityMinutes: true
    }
  });
  return NextResponse.json({ ok: true, products });
}
