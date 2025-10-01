import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePixKey, genEVP, type PixKeyType } from "@/lib/pix";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { accountId, type, value, setPrimary } = await req.json() as {
      accountId: string; type: PixKeyType; value?: string; setPrimary?: boolean;
    };
    if (!accountId || !type) return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });

    const normalized = type === "EVP" ? genEVP() : normalizePixKey(type, value || "");

    // impede duplicidade global
    const exists = await prisma.pixKey.findUnique({
      where: { type_value: { type, value: normalized } },
    });
    if (exists) return NextResponse.json({ error: "Chave Pix já cadastrada." }, { status: 409 });

    const created = await prisma.$transaction(async (tx) => {
      if (setPrimary) {
        await tx.pixKey.updateMany({ where: { accountId }, data: { isPrimary: false } });
      }
      return tx.pixKey.create({
        data: { accountId, type, value: normalized, isPrimary: !!setPrimary },
      });
    });

    return NextResponse.json({ ok: true, key: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno." }, { status: 500 });
  }
}
