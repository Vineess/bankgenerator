import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compoundByMinutes, diffMinutes } from "@/lib/invest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { accountId } = await req.json();
    if (!accountId) return NextResponse.json({ error: "accountId é obrigatório." }, { status: 400 });

    const rows = await prisma.investmentPosition.findMany({
      where: { accountId },
      orderBy: { openedAt: "desc" },
      include: { product: true }
    });

    const now = new Date();
    const items = rows.map(r => {
      const minutes = r.status === "ACTIVE" ? diffMinutes(r.openedAt, now) : 0;
      const currentCents =
        r.status === "ACTIVE"
          ? compoundByMinutes(r.principalCents, r.product.minuteRatePpm, minutes)
          : (r.redeemedCents ?? r.principalCents);

      const gainCents = Math.max(0, currentCents - r.principalCents);

      return {
        id: r.id,
        status: r.status,
        openedAt: r.openedAt,
        closedAt: r.closedAt,
        product: {
          id: r.productId,
          name: r.product.name,
          code: r.product.code,
          minuteRatePpm: r.product.minuteRatePpm,
          liquidityMinutes: r.product.liquidityMinutes,
        },
        principalCents: r.principalCents,
        currentCents,
        gainCents,
      };
    });

    return NextResponse.json({ ok: true, positions: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro." }, { status: 500 });
  }
}
