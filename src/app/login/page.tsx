"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { onlyDigits } from "@/lib/cpf";
import { setSession } from "@/lib/session";

export default function LoginPage() {
  const r = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const fd = new FormData(e.currentTarget);
    const cpf = onlyDigits(String(fd.get("cpf") || ""));
    const password = String(fd.get("password") || "");

    if (cpf.length !== 11) return setErr("Informe 11 dígitos de CPF.");
    if (!password) return setErr("Informe a senha.");

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, password }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) return setErr(json?.error ?? "CPF ou senha inválidos.");

      setSession({ userId: json.user.id });      // ⬅️ usa helper
      r.replace("/app");                          // ⬅️ evita voltar ao login no histórico
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
        <h1 className="text-xl font-semibold">Entrar</h1>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium">CPF</label>
            <input id="cpf" name="cpf" inputMode="numeric" pattern="[0-9]*"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="00000000036" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Senha</label>
            <input id="password" name="password" type="password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="••••••••" />
          </div>
          <button disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60">
            {loading ? "Acessando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
