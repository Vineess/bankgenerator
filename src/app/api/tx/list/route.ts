import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * GET /api/tx/list?accountId=...&limit=10&cursor=txId
 * - Retorna transações onde a conta participa (fromId ou toId)
 * - Ordena decrescente por createdAt e id
 * - Paginação por cursor (id)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);
    const cursor = searchParams.get("cursor"); // tx.id

    if (!accountId) {
      return NextResponse.json({ error: "accountId obrigatório" }, { status: 400 });
    }

    const where = {
      OR: [{ fromId: accountId }, { toId: accountId }],
    };

    const items = await prisma.transaction.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        from: { select: { id: true, number: true } },
        to: { select: { id: true, number: true } },
      },
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1]?.id : null;

    return NextResponse.json({ ok: true, items: data, nextCursor });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}
