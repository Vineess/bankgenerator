export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/invest/positions/cleanup-closed
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId obrigatório." }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { account: { select: { id: true } } },
    });
    const accountId = user?.account?.id;
    if (!accountId) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    const result = await prisma.investmentPosition.deleteMany({
      where: { accountId, status: "CLOSED" },
    });

    return NextResponse.json({ ok: true, deleted: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erro interno." }, { status: 500 });
  }
}
