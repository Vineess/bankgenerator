// src/app/api/pix/send/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePixKey, PixKeyType } from "@/lib/pix";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

type Body = {
  fromAccountId: string;
  keyType: PixKeyType;      // "CPF" | "EMAIL" | "PHONE" | "EVP"
  key: string;              // valor cru (será normalizado)
  amountCents: number;      // inteiro (centavos)
  note?: string;
};

// Máscara simples para descrição
function maskKey(keyType: PixKeyType, value: string) {
  if (keyType === "CPF") return value.replace(/^(\d{3})\d{5}(\d{3})$/, "$1*****$2");
  if (keyType === "PHONE") return value.replace(/^(\d{2})\d{5}(\d{2})$/, "($1)*****-$2");
  if (keyType === "EMAIL") {
    const [u, d] = value.split("@");
    if (!u || !d) return value;
    return (u[0] ?? "") + "***@" + d;
  }
  return value.slice(0, 6) + "..." + value.slice(-4); // EVP
}

// E2EID “fake” para demo
function genE2EId() {
  return "E2E-" + crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.fromAccountId || !body?.keyType || !body?.key) {
      return NextResponse.json({ error: "Parâmetros ausentes." }, { status: 400 });
    }
    if (!body.amountCents || body.amountCents <= 0) {
      return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
    }

    // 1) Normaliza a chave
    const keyNorm = normalizePixKey(body.keyType, body.key);

    // 2) Busca a chave destino por índice composto (type, value)
    type PixKeyWithAccount = Prisma.PixKeyGetPayload<{ include: { account: true } }>;
    const destKey = (await prisma.pixKey.findUnique({
      where: { type_value: { type: body.keyType, value: keyNorm } },
      include: { account: true },
    })) as PixKeyWithAccount | null;

    if (!destKey || !destKey.account) {
      return NextResponse.json({ error: "Chave Pix não encontrada." }, { status: 404 });
    }

    // 3) Origem precisa existir
    const from = await prisma.account.findUnique({ where: { id: body.fromAccountId } });
    if (!from) {
      return NextResponse.json({ error: "Conta de origem inexistente." }, { status: 404 });
    }

    // 4) Impede enviar para si mesmo
    if (destKey.accountId === from.id) {
      return NextResponse.json(
        { error: "Não é possível enviar Pix para a mesma conta." },
        { status: 400 }
      );
    }

    // 5) Saldo suficiente
    if (from.balance < body.amountCents) {
      return NextResponse.json({ error: "Saldo insuficiente." }, { status: 400 });
    }

    // 6) Transação
    const toId = destKey.accountId;
    const amount = body.amountCents;
    const description =
      (body.note?.slice(0, 140) ??
        `PIX ${body.keyType} • ${maskKey(body.keyType, keyNorm)}`) + "";

    const e2e = genE2EId();

    await prisma.$transaction(async (tx) => {
      // Debita origem
      await tx.account.update({
        where: { id: from.id },
        data: { balance: { decrement: amount } },
      });

      // Credita destino
      await tx.account.update({
        where: { id: toId },
        data: { balance: { increment: amount } },
      });

      // Transação contábil
      await tx.transaction.create({
        data: {
          kind: "TRANSFER",
          amount,
          note: description,
          fromId: from.id,
          toId,
        },
      });

      // PixTransfer OUT (origem)
      await tx.pixTransfer.create({
        data: {
          endToEndId: e2e,
          fromAccountId: from.id,
          toAccountId: toId,
          amount,                         // <- campo correto no schema
          description,                    // <- campo correto
          direction: "OUT",
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // PixTransfer IN (destino) – opcional, mas útil para listar por direção
      await tx.pixTransfer.create({
        data: {
          endToEndId: e2e,
          fromAccountId: from.id,
          toAccountId: toId,
          amount,
          description,
          direction: "IN",
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[PIX SEND] error:", e);
    const msg =
      typeof e?.message === "string" && e.message.length < 200
        ? e.message
        : "Erro interno.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
