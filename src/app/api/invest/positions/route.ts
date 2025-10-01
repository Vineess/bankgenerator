// src/app/api/invest/positions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compoundByMinutes, diffMinutes } from "@/lib/invest";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { accountId } = await req.json();
    if (!accountId) {
      return NextResponse.json(
        { error: "accountId é obrigatório." },
        { status: 400 }
      );
    }

    const rows = await prisma.investmentPosition.findMany({
      where: { accountId },
      orderBy: { openedAt: "desc" },
      include: { product: true },
    });

    const now = new Date();

    const items = rows.map((r) => {
      // garante número normal (p/ caso venham como bigint do DB)
      const principal = Number(r.principalCents);
      const ratePpm = Number(r.product.minuteRatePpm);

      const minutes = r.status === "ACTIVE" ? diffMinutes(r.openedAt, now) : 0;

      const currentCents =
        r.status === "ACTIVE"
          ? compoundByMinutes(principal, ratePpm, minutes)
          : Number(r.redeemedCents ?? principal);

      const gainCents = Math.max(0, currentCents - principal);

      return {
        id: r.id,
        status: r.status as "ACTIVE" | "CLOSED",
        openedAt: r.openedAt,
        closedAt: r.closedAt,
        product: {
          id: r.productId,
          name: r.product.name,
          code: r.product.code,
          minuteRatePpm: ratePpm,
          liquidityMinutes: r.product.liquidityMinutes,
        },
        principalCents: principal,
        currentCents,
        gainCents,
      };
    });

    return NextResponse.json(bigintsToNumbers({ ok: true, positions: items }));
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message ?? "Erro." },
      { status: 500 }
    );
  }
}
