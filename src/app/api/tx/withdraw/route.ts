import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

function toPositiveInt(v: unknown) {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export async function POST(req: Request) {
  try {
    const { accountId, amount, note } = await req.json();
    const cents = toPositiveInt(amount);
    const cleanNote = typeof note === "string" ? note.trim() : null;

    if (!accountId || cents <= 0) {
      return NextResponse.json({ error: "Dados inválidos (valor ou conta)." }, { status: 400 });
    }

    const out = await prisma.$transaction(async (tx) => {
      const acc = await tx.account.findUnique({ where: { id: accountId } });
      if (!acc) throw new Error("Conta não encontrada.");
      if (Number(acc.balance) < cents) throw new Error("Saldo insuficiente.");

      const updated = await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: cents } },
      });

      const t = await tx.transaction.create({
        data: {
          kind: "WITHDRAW",
          amount: cents,
          note: cleanNote,
          fromId: updated.id,
        },
      });

      return { account: updated, tx: t };
    });

    return NextResponse.json(bigintsToNumbers({ ok: true, ...out }));
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
  }
}
