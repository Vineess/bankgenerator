import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { accountId, amount, note } = await req.json();
        const cents = Number(amount | 0);
        if (!accountId || cents <= 0) {
            return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
        }

        const out = await prisma.$transaction(async (tx) => {
            const acc = await tx.account.findUnique({ where: { id: accountId } });
            if (!acc) throw new Error("Conta não encontrada");
            if (acc.balance < cents) throw new Error("Saldo insuficiente");

            const updated = await tx.account.update({
                where: { id: accountId },
                data: { balance: { decrement: cents } },
            });

            const t = await tx.transaction.create({
                data: {
                    kind: "TRANSFER",
                    amount: cents,
                    note: note ?? null,
                    fromId: updated.id,
                },
            });

            return { account: updated, tx: t };
        });

        return NextResponse.json({ ok: true, ...out });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
    }
}