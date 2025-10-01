// src/app/api/tx/list/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bigintsToNumbers } from "@/lib/bigint";

export const runtime = "nodejs";

/**
 * GET /api/tx/list?accountId=...&limit=10&cursor=txId&kind=IN|OUT|DEPOSIT|WITHDRAW|TRANSFER|ALL&sinceDays=7|30|0&q=texto
 * - Filtra por tipo, período e busca (nota/conta contraparte).
 * - Ordena por createdAt desc, id desc.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    if (!accountId) {
      return NextResponse.json({ error: "accountId é obrigatório." }, { status: 400 });
    }

    const limitParam = Number(searchParams.get("limit") ?? 10);
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, limitParam)) : 10;

    const cursor = searchParams.get("cursor") || undefined;

    const kind = (searchParams.get("kind") || "ALL").toUpperCase();
    const sinceDaysParam = Number(searchParams.get("sinceDays") ?? 30);
    const sinceDays = Number.isFinite(sinceDaysParam) ? sinceDaysParam : 30;
    const q = (searchParams.get("q") || "").trim();

    const since =
      sinceDays > 0 ? new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000) : undefined;

    // base: transações onde a conta é origem ou destino
    const baseWhere: any = {
      OR: [{ fromId: accountId }, { toId: accountId }],
      ...(since ? { createdAt: { gte: since } } : {}),
    };

    // mapeia IN/OUT para combinações
    if (kind === "IN") {
      baseWhere.AND = [
        { OR: [{ toId: accountId }] },
        { OR: [{ kind: "DEPOSIT" }, { kind: "TRANSFER" }] },
      ];
    } else if (kind === "OUT") {
      baseWhere.AND = [
        { OR: [{ fromId: accountId }] },
        { OR: [{ kind: "WITHDRAW" }, { kind: "TRANSFER" }] },
      ];
    } else if (["DEPOSIT", "WITHDRAW", "TRANSFER"].includes(kind)) {
      baseWhere.kind = kind;
    }
    // (se futuramente usar "PIX_IN"/"PIX_OUT", adicione os casos aqui)

    // busca: nota ou número da contraparte
    // (nota contém q) OR (to.number contém q) OR (from.number contém q)
    const where = {
      AND: [
        baseWhere,
        q
          ? {
              OR: [
                { note: { contains: q, mode: "insensitive" } },
                { to: { number: { contains: q, mode: "insensitive" } } },
                { from: { number: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {},
      ],
    };

    const items = await prisma.transaction.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        kind: true,
        amount: true,           // BIGINT -> precisa serializar
        createdAt: true,
        note: true,
        fromId: true,
        toId: true,
        from: { select: { id: true, number: true } },
        to: { select: { id: true, number: true } },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const next = items.pop()!;
      nextCursor = next.id;
    }

    // Serializa BigInt (amount) antes de responder
    return NextResponse.json(bigintsToNumbers({ ok: true, items, nextCursor }));
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
  }
}
