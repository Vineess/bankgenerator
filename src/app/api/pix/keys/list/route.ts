import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { accountId } = await req.json();
    if (!accountId) return NextResponse.json({ error: "accountId é obrigatório." }, { status: 400 });

    const keys = await prisma.pixKey.findMany({
      where: { accountId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ ok: true, keys });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno." }, { status: 500 });
  }
}
