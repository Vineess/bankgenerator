import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genExp, genLast4, genPanToken } from "@/lib/card";

export const runtime = "nodejs";

/**
 * POST /api/cards/create
 * Body: {
 *   accountId: string,
 *   type: "DEBIT" | "CREDIT",
 *   isVirtual?: boolean,
 *   brand?: string,
 *   holderName: string,
 *   creditLimit?: number  // centavos (obrigatório se CREDIT)
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accountId, type, isVirtual = false, brand = "VISA", holderName, creditLimit } = body || {};

    if (!accountId || !type || !holderName) {
      return NextResponse.json({ error: "Campos obrigatórios: accountId, type, holderName." }, { status: 400 });
    }
    if (type !== "DEBIT" && type !== "CREDIT") {
      return NextResponse.json({ error: "type inválido." }, { status: 400 });
    }
    if (type === "CREDIT" && (typeof creditLimit !== "number" || creditLimit <= 0)) {
      return NextResponse.json({ error: "creditLimit (centavos) é obrigatório para cartão de crédito." }, { status: 400 });
    }

    // confere conta
    const acc = await prisma.account.findUnique({ where: { id: accountId } });
    if (!acc) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });

    const last4 = genLast4();
    const { month, year } = genExp();

    const card = await prisma.card.create({
      data: {
        accountId,
        type,
        isVirtual,
        brand,
        holderName,
        last4,
        panToken: genPanToken(),
        expMonth: month,
        expYear: year,
        ...(type === "CREDIT"
          ? { creditLimit, availableCredit: creditLimit }
          : {}),
      },
      select: {
        id: true, type: true, isVirtual: true, brand: true, holderName: true,
        last4: true, expMonth: true, expYear: true, status: true,
        creditLimit: true, availableCredit: true, createdAt: true,
      },
    });

    return NextResponse.json({ ok: true, card });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
  }
}
