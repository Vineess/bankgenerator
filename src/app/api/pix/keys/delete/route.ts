import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { keyId, accountId } = await req.json();
    if (!keyId || !accountId) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

    const key = await prisma.pixKey.findFirst({ where: { id: keyId, accountId } });
    if (!key) return NextResponse.json({ error: "Chave não encontrada." }, { status: 404 });

    await prisma.pixKey.delete({ where: { id: keyId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno." }, { status: 500 });
  }
}
