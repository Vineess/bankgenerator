import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const data = [
    {
      code: "CDB-FLEX",
      name: "CDB Flex",
      description: "Liquidez imediata, rendimento a cada minuto.",
      minuteRatePpm: 2500,   // 0,25%/min (DEMO)
      minAmountCents: 5000, // R$ 50
      liquidityMinutes: 0,
    },
    {
      code: "CDB-PLUS",
      name: "CDB Plus",
      description: "Liquidez 60 min, taxa maior.",
      minuteRatePpm: 4300,    // 0,43%/min
      minAmountCents: 10000, // R$ 100
      liquidityMinutes: 2,
    },
    {
      code: "CDB-TURBO",
      name: "CDB Turbo",
      description: "Liquidez 180 min, taxa turbinada.",
      minuteRatePpm: 6800,   // 0,68%/min
      minAmountCents: 10000,
      liquidityMinutes: 3,
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
