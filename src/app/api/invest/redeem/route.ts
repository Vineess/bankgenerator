import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compoundByMinutes, diffMinutes } from "@/lib/invest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { accountId, positionId } = await req.json();
    if (!accountId || !positionId) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }

    const pos = await prisma.investmentPosition.findUnique({
      where: { id: positionId },
      include: { product: true },
    });

    if (!pos || pos.accountId !== accountId) {
      return NextResponse.json({ error: "Posição inválida." }, { status: 400 });
    }
    if (pos.status !== "ACTIVE") {
      return NextResponse.json({ error: "Posição já encerrada." }, { status: 400 });
    }

    const now = new Date();
    const minutes = diffMinutes(pos.openedAt, now);

    // checa liquidez (mínimo de minutos)
    if (minutes < pos.product.liquidityMinutes) {
      return NextResponse.json({
        error: `Liquidez em ${pos.product.liquidityMinutes} min. Aguarde para resgatar.`,
      }, { status: 400 });
    }

    const currentCents = compoundByMinutes(
      pos.principalCents,
      pos.product.minuteRatePpm,
      minutes
    );
    const gain = Math.max(0, currentCents - pos.principalCents);
    const fee = Math.floor(gain * 0.05); // 5% do ganho
    const redeemCents = currentCents - fee;

    await prisma.$transaction(async (tx) => {
      // credita saldo
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: redeemCents } },
      });

      // fecha posição
      await tx.investmentPosition.update({
        where: { id: positionId },
        data: {
          status: "CLOSED",
          closedAt: now,
          redeemedCents: redeemCents,
        },
      });

      // (opcional) registrar transação TX também
    });

    return NextResponse.json({ ok: true, redeemedCents: redeemCents, feeCents: fee });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro no resgate." }, { status: 500 });
  }
}
