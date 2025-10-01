import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const limit = Math.max(1, Math.min(50, Number(searchParams.get("limit") ?? 10)));
    const cursor = searchParams.get("cursor") || undefined;

    const kind = (searchParams.get("kind") || "ALL").toUpperCase();
    const sinceDays = Number(searchParams.get("sinceDays") ?? 30);
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
        id: true, kind: true, amount: true, createdAt: true, note: true,
        fromId: true, toId: true,
        from: { select: { id: true, number: true } },
        to: { select: { id: true, number: true } },
      },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const next = items.pop()!;
      nextCursor = next.id;
    }
    return NextResponse.json({ ok: true, items, nextCursor });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno." }, { status: 500 });
  }
}
