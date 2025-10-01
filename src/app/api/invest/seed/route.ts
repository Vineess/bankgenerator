import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const data = [
    {
      code: "CDB-FLEX",
      name: "CDB Flex",
      description: "Liquidez imediata, rendimento a cada minuto.",
      minuteRatePpm: 500,   // 0,05%/min (DEMO)
      minAmountCents: 5000, // R$ 50
      liquidityMinutes: 0,
    },
    {
      code: "CDB-PLUS",
      name: "CDB Plus",
      description: "Liquidez 60 min, taxa maior.",
      minuteRatePpm: 800,    // 0,08%/min
      minAmountCents: 10000, // R$ 100
      liquidityMinutes: 60,
    },
    {
      code: "CDB-TURBO",
      name: "CDB Turbo",
      description: "Liquidez 180 min, taxa turbinada.",
      minuteRatePpm: 1200,   // 0,12%/min
      minAmountCents: 10000,
      liquidityMinutes: 180,
    },
  ];

  for (const p of data) {
    await prisma.investmentProduct.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    });
  }
  return NextResponse.json({ ok: true });
}
