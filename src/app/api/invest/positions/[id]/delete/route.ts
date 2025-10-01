export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

// DELETE /api/invest/positions/:id/delete
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await req.json();
    const positionId = params.id;

    if (!userId || !positionId) {
      return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
    }

    // pega a conta do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { account: { select: { id: true } } },
    });
    const accountId = user?.account?.id;
    if (!accountId) {
      return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
    }

    // confere se a posição é da conta e está encerrada
    const pos = await prisma.investmentPosition.findUnique({
      where: { id: positionId },
      select: { id: true, accountId: true, status: true },
    });
    if (!pos || pos.accountId !== accountId) {
      return NextResponse.json({ error: "Posição não encontrada." }, { status: 404 });
    }
    if (pos.status !== "CLOSED") {
      return NextResponse.json({ error: "Apenas posições ENCERRADAS podem ser excluídas." }, { status: 400 });
    }

    await prisma.investmentPosition.delete({ where: { id: positionId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erro interno." }, { status: 500 });
  }
}
