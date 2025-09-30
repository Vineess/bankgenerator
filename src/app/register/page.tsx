"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { onlyDigits } from "@/lib/cpf";
import { setSession } from "@/lib/session";

export default function RegisterPage() {
  const r = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const cpf = onlyDigits(String(fd.get("cpf") || ""));
    const password = String(fd.get("password") || "");

    if (name.length < 2) return setErr("Nome inválido.");
    if (cpf.length !== 11) return setErr("CPF inválido (11 dígitos).");
    if (password.length < 6) return setErr("Senha deve ter pelo menos 6 caracteres.");

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cpf, password }),
      });
      const json = await res.json();
      if (!res.ok) return setErr(json?.error ?? "Falha ao registrar.");

      setSession({ userId: json.user.id });  // ⬅️ usa helper
      r.replace("/app");                      // ⬅️ idem
    } catch {
      setErr("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <a href="/" className="group inline-flex items-center gap-2">
        <Logo size={22} />
        <span className="font-semibold">NovaBank <span className="text-emerald-600">EDU</span></span>
        <span className="ml-2 text-xs text-slate-500 group-hover:underline">voltar</span>
      </a>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Criar conta bancária (fictícia)</h1>
        <p className="mt-1 text-sm text-slate-600">
          Não use dados reais. No modo demo aceitamos CPFs “de teste”.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Nome completo</label>
            <input id="name" name="name"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Maria Silva" required />
          </div>
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium">CPF (apenas dígitos)</label>
            <input id="cpf" name="cpf" inputMode="numeric" pattern="[0-9]*"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="00000000036" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Senha</label>
            <input id="password" type="password" name="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="mínimo 6 caracteres" required />
          </div>

          <div className="pt-2 flex gap-2">
            <button disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60">
              {loading ? "Criando..." : "Criar conta"}
            </button>
            <a href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:brightness-110">
              Já tenho conta
            </a>
          </div>
        </form>
      </section>
    </main>
  );
}
