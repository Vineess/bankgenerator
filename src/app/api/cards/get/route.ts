import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/cards/get?cardId=...
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get("cardId");
    if (!cardId) return NextResponse.json({ error: "cardId é obrigatório." }, { status: 400 });

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true, accountId: true, type: true, isVirtual: true, brand: true, holderName: true,
        last4: true, expMonth: true, expYear: true, status: true,
        creditLimit: true, availableCredit: true, createdAt: true, updatedAt: true,
        account: { select: { number: true, agency: true } },
      },
    });

    if (!card) return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });
    return NextResponse.json({ ok: true, card });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
  }
}
