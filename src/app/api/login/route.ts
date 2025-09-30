import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { onlyDigits } from "@/lib/cpf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { cpf: cpfRaw, password } = await req.json();
    const cpf = onlyDigits(String(cpfRaw ?? ""));

    const user = await prisma.user.findUnique({ where: { cpf } });
    if (!user) return NextResponse.json({ error: "CPF ou senha inválidos." }, { status: 401 });

    const ok = await bcrypt.compare(String(password ?? ""), user.passwordHash);
    if (!ok) return NextResponse.json({ error: "CPF ou senha inválidos." }, { status: 401 });

    const account = await prisma.account.findUnique({ where: { ownerId: user.id } });

    return NextResponse.json({ ok: true, user, account });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
