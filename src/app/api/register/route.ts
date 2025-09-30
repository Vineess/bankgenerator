import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { onlyDigits, validateCPF } from "@/lib/cpf";

export const runtime = "nodejs";

function genAgency() { return "0001"; }
function genAccountNumber() {
  const n = Math.floor(100000 + Math.random() * 900000).toString();
  const dv = n.split("").reduce((a, b) => (a + parseInt(b, 10)) % 10, 0);
  return `${n}-${dv}`;
}

export async function POST(req: Request) {
  try {
    const { name, cpf: cpfRaw, password } = await req.json();
    const cpf = onlyDigits(String(cpfRaw ?? ""));

    if (!name || name.trim().length < 2)
      return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    if (!validateCPF(cpf))
      return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
    if (!password || String(password).length < 6)
      return NextResponse.json({ error: "Senha deve ter ao menos 6 caracteres." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { cpf } });
    if (existing)
      return NextResponse.json({ error: "CPF já registrado." }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        cpf,
        passwordHash: await bcrypt.hash(String(password), 10),
      },
    });

    const account = await prisma.account.create({
      data: {
        ownerId: user.id,
        agency: genAgency(),
        number: genAccountNumber(),
        balance: 0,
      },
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, cpf: user.cpf },
      account: { id: account.id, agency: account.agency, number: account.number },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
