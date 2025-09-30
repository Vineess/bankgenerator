import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "no session" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: String(userId) } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  const account = await prisma.account.findUnique({ where: { ownerId: user.id } });
  return NextResponse.json({ user, account });
}
