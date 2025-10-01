// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

    const account = await prisma.account.findUnique({ where: { ownerId: user.id } });

    return NextResponse.json(bigintsToNumbers({ user, account }));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
