import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/cards/list?accountId=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    if (!accountId) return NextResponse.json({ error: "accountId é obrigatório." }, { status: 400 });

    const cards = await prisma.card.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, type: true, isVirtual: true, brand: true, holderName: true,
        last4: true, expMonth: true, expYear: true, status: true,
        creditLimit: true, availableCredit: true, createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, cards });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
  }
}
