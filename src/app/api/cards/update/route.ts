import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * PATCH /api/cards/update
 * Body:
 *  - cardId: string
 *  - action?: "BLOCK"|"UNBLOCK"|"CANCEL"
 *  - creditLimit?: number (centavos)  // somente se type == CREDIT
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { cardId, action, creditLimit } = body || {};
    if (!cardId) return NextResponse.json({ error: "cardId é obrigatório." }, { status: 400 });

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return NextResponse.json({ error: "Cartão não encontrado." }, { status: 404 });

    // ações de estado
    if (action) {
      if (action === "BLOCK" && card.status !== "CANCELED") {
        await prisma.card.update({ where: { id: cardId }, data: { status: "BLOCKED" } });
      } else if (action === "UNBLOCK" && card.status === "BLOCKED") {
        await prisma.card.update({ where: { id: cardId }, data: { status: "ACTIVE" } });
      } else if (action === "CANCEL") {
        await prisma.card.update({ where: { id: cardId }, data: { status: "CANCELED" } });
      }
    }

    // ajuste de limite (somente crédito)
    if (typeof creditLimit === "number") {
      if (card.type !== "CREDIT") {
        return NextResponse.json({ error: "Ajuste de limite só é permitido para cartão de crédito." }, { status: 400 });
      }
      if (creditLimit <= 0) {
        return NextResponse.json({ error: "creditLimit deve ser maior que zero." }, { status: 400 });
      }

      // regra simples: recalcular availableCredit proporcional ao delta
      // (educacional; em produção consideraria fatura/uso real)
      const prev = card.creditLimit ?? 0;
      const used = prev - (card.availableCredit ?? prev);
      const newAvail = Math.max(0, creditLimit - used);

      await prisma.card.update({
        where: { id: cardId },
        data: { creditLimit, availableCredit: newAvail },
      });
    }

    const updated = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true, accountId: true, type: true, isVirtual: true, brand: true, holderName: true,
        last4: true, expMonth: true, expYear: true, status: true,
        creditLimit: true, availableCredit: true, createdAt: true, updatedAt: true,
        account: { select: { number: true, agency: true } },
      },
    });

    return NextResponse.json({ ok: true, card: updated });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
  }
}
