// src/app/api/tx/deposit/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json() as { accountId: string; amount: number; note?: string };
    const centsNum = Number(body?.amount);
    if (!body?.accountId || !Number.isFinite(centsNum) || centsNum <= 0) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const cents = BigInt(Math.trunc(centsNum));

    const out = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.findUnique({ where: { id: body.accountId } });
      if (!acc) throw new Error("Conta não encontrada.");

      const updated = await tx.account.update({
        where: { id: body.accountId },
        data: { balance: { increment: cents } },
      });

      const t = await tx.transaction.create({
        data: {
          kind: "DEPOSIT",
          amount: cents,
          note: body.note ?? null,
          toId: updated.id,
        },
      });

      return { account: updated, tx: t };
    });

    // <<< CONVERSÃO AQUI
    return NextResponse.json(bigintsToNumbers({ ok: true, ...out }));
  } catch (e: any) {
    console.error("[DEPOSIT]", e);
    return NextResponse.json({ error: e?.message ?? "Erro interno." }, { status: 500 });
  }
}
