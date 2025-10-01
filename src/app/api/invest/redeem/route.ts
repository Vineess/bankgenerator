// src/app/api/invest/redeem/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compoundByMinutes, diffMinutes } from "@/lib/invest";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

/**
 * POST /api/invest/redeem
 * Body: { accountId: string, positionId: string, amountCents?: number }
 * - Se amountCents estiver ausente ou <= 0, faz resgate TOTAL.
 * - Caso contrário, resgate PARCIAL até o currentCents.
 * - Taxa: 1% apenas sobre o ganho proporcional ao valor resgatado.
 */
export async function POST(req: Request) {
  try {
    const { accountId, positionId, amountCents } = await req.json();
    if (!accountId || !positionId) {
      return NextResponse.json(
        { error: "Parâmetros inválidos." },
        { status: 400 }
      );
    }

    const pos = await prisma.investmentPosition.findUnique({
      where: { id: positionId },
      include: { product: true },
    });

    if (!pos || pos.accountId !== accountId) {
      return NextResponse.json({ error: "Posição inválida." }, { status: 400 });
    }
    if (pos.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Posição já encerrada." },
        { status: 400 }
      );
    }

    const now = new Date();
    const minutes = diffMinutes(pos.openedAt, now);

    // Liquidez mínima
    if (minutes < pos.product.liquidityMinutes) {
      return NextResponse.json(
        {
          error: `Liquidez em ${pos.product.liquidityMinutes} min. Aguarde para resgatar.`,
        },
        { status: 400 }
      );
    }

    // Garantir números "normais"
    const principal = Number(pos.principalCents);
    const ratePpm = Number(pos.product.minuteRatePpm);

    // Valor atual pela capitalização
    const currentCents = compoundByMinutes(principal, ratePpm, minutes);
    const gainTotal = Math.max(0, currentCents - principal);

    // Determina o valor solicitado (parcial ou total)
    const chosen = Number(amountCents ?? 0);
    const valueToRedeem =
      !chosen || chosen <= 0
        ? currentCents
        : Math.min(chosen, currentCents);

    // Proporção do resgate em relação ao valor atual
    const p = currentCents > 0 ? valueToRedeem / currentCents : 0;

    // Ganho proporcional e taxa (1% do ganho proporcional)
    const gainPart = Math.round(gainTotal * p);
    const fee = Math.round(gainPart * 0.01); // 1% do ganho proporcional
    const net = Math.max(0, valueToRedeem - fee);

    // Valores remanescentes após resgate parcial
    const remainingCurrent = Math.max(0, currentCents - valueToRedeem);
    // Recalcula principal remanescente proporcionalmente (sobre o principal original)
    const remainingPrincipal = Math.max(0, principal - Math.round(principal * p));

    const isFull = valueToRedeem >= currentCents;

    await prisma.$transaction(async (tx) => {
      // credita saldo líquido na conta
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: net } },
      });

      if (isFull) {
        // resgate TOTAL -> encerra posição
        await tx.investmentPosition.update({
          where: { id: positionId },
          data: {
            status: "CLOSED",
            closedAt: now,
            redeemedCents: valueToRedeem, // total bruto resgatado
          },
        });
      } else {
        // resgate PARCIAL -> reabre posição com o valor remanescente
        // estratégia: define principalCents = remainingCurrent (valor atual remanescente),
        // e reinicia o período com openedAt = now
        await tx.investmentPosition.update({
          where: { id: positionId },
          data: {
            principalCents: remainingCurrent,
            openedAt: now,
          },
        });
      }

      // (opcional) Poderia registrar em Transaction uma linha de "INVEST_REDEEM"
      // com amount = net e note com detalhes, se desejar.
    });

    return NextResponse.json(
      bigintsToNumbers({
        ok: true,
        kind: isFull ? "FULL" : "PARTIAL",
        requestedCents: valueToRedeem,
        feeCents: fee,
        netCents: net,
        remainingCurrent: isFull ? 0 : remainingCurrent,
        remainingPrincipal: isFull ? 0 : remainingPrincipal,
      })
    );
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message ?? "Erro no resgate." },
      { status: 500 }
    );
  }
}
