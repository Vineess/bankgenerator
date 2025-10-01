// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { cpf, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { cpf } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    // ... verificação de senha omitida ...

    const account = await prisma.account.findUnique({ where: { ownerId: user.id } });

    // <<< CONVERSÃO AQUI
    return NextResponse.json(bigintsToNumbers({ ok: true, user, account }));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
