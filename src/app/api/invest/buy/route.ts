import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { accountId, productId, amountCents } = await req.json();
    if (!accountId || !productId || !amountCents) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const [acc, prod] = await Promise.all([
      prisma.account.findUnique({ where: { id: accountId } }),
      prisma.investmentProduct.findUnique({ where: { id: productId } }),
    ]);
    if (!acc || !prod) return NextResponse.json({ error: "Conta ou produto inválido." }, { status: 400 });
    if (amountCents < prod.minAmountCents) {
      return NextResponse.json({ error: "Valor menor que o mínimo do produto." }, { status: 400 });
    }
    if (acc.balance < amountCents) {
      return NextResponse.json({ error: "Saldo insuficiente." }, { status: 400 });
    }

    const res = await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amountCents } },
      });

      const pos = await tx.investmentPosition.create({
        data: {
          accountId,
          productId,
          principalCents: amountCents,
        },
      });

      return pos;
    });

    return NextResponse.json({ ok: true, positionId: res.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro ao investir." }, { status: 500 });
  }
}
