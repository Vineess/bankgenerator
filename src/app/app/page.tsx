"use client";

import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/Logo";
import { getSession, logout } from "@/lib/session";
import { cents } from "@/lib/storage";

type MeResponse = {
  user: { id: string; name: string; cpf: string; createdAt: string };
  account: { id: string; agency: string; number: string; balance: number; createdAt: string };
};

export default function AppHome() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [account, setAccount] = useState<MeResponse["account"] | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) { window.location.href = "/login"; return; }

    fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: s.userId }),
    })
      .then(r => r.json())
      .then((json: MeResponse | { error: string }) => {
        // @ts-expect-error runtime guard
        if (json?.error) { window.location.href = "/login"; return; }
        setUser((json as MeResponse).user);
        setAccount((json as MeResponse).account);
        setReady(true);
      })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  if (!ready) return <LoadingSkeleton />;

  const balanceTxt = cents(account?.balance ?? 0);
  const firstName = (user?.name ?? "").split(" ")[0] || "Cliente";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* background: grid + radial glow */}
      <BgDecor />

      {/* navbar */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-base font-semibold tracking-tight">
            NovaBank <span className="text-emerald-600">EDU</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">
            Olá, <b>{firstName}</b>
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 text-sm font-semibold text-white shadow">
            {firstName.slice(0,1).toUpperCase()}
          </div>
          <button
            onClick={() => { logout(); window.location.href = "/"; }}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
            aria-label="Sair"
          >
            Sair
          </button>
        </div>
      </header>

      {/* content */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-16 lg:grid-cols-3">
        {/* Balance Card */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-sky-400/10 to-indigo-400/10" />
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Saldo disponível</p>
                  <h1 className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">
                    {balanceTxt}
                  </h1>
                  <p className="mt-2 text-xs text-slate-500">
                    Agência <b>{account?.agency}</b> • Conta <b>{account?.number}</b>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Action href="/app/deposit" label="Depositar" intent="positive" />
                  <Action href="/app/withdraw" label="Sacar" intent="negative" />
                  <Action href="/app/transfer" label="Transferir" intent="primary" />
                </div>
              </div>

              {/* shortcuts */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Shortcut label="Pix (em breve)" />
                <Shortcut label="Pagar boleto (em breve)" />
                <Shortcut label="Cartões (em breve)" />
                <Shortcut label="Investir (em breve)" />
              </div>
            </div>
          </div>
        </div>

        {/* Account Info / Education */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Sua conta</h3>
            <div className="mt-3 space-y-3 text-sm">
              <InfoRow k="Titular" v={user?.name ?? "-"} />
              <InfoRow k="Agência" v={account?.agency ?? "-"} />
              <InfoRow k="Conta" v={account?.number ?? "-"} />
              <InfoRow k="Abertura" v={new Date(account?.createdAt ?? Date.now()).toLocaleDateString("pt-BR")} />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
            <p className="font-medium">Ambiente educativo</p>
            <p className="mt-1">
              Este projeto não movimenta dinheiro real e não se conecta a instituições financeiras.
              Use dados fictícios.
            </p>
          </div>
        </aside>

        {/* Statement (placeholder até implementarmos transações) */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Extrato</h3>
              <span className="text-xs text-slate-500">em breve</span>
            </div>

            <EmptyStatement />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- components ---------- */

function BgDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 [background:radial-gradient(80rem_60rem_at_50%_-10%,rgb(16_185_129_/_0.2),transparent_50%)]" />
      <div className="absolute inset-0 [mask-image:radial-gradient(1200px_600px_at_center,white,transparent)]">
        <div className="h-full w-full bg-[length:28px_28px] bg-[linear-gradient(to_right,rgba(15,23,42,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.06)_1px,transparent_1px)]" />
      </div>
    </div>
  );
}

function Action({ href, label, intent }:{
  href: string; label: string; intent: "primary"|"positive"|"negative";
}) {
  const cls =
    intent === "positive" ? "bg-emerald-600 focus:ring-emerald-700" :
    intent === "negative" ? "bg-rose-600 focus:ring-rose-700" :
    "bg-sky-600 focus:ring-sky-700";
  return (
    <a
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 ${cls}`}
    >
      {label}
    </a>
  );
}

function Shortcut({ label }: { label: string }) {
  return (
    <button
      disabled
      title="Em breve"
      className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm text-slate-600 shadow-sm backdrop-blur transition hover:brightness-105 disabled:opacity-90"
    >
      {label}
    </button>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function EmptyStatement() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
      <p className="text-sm text-slate-600">
        Nenhuma movimentação por enquanto. Faça um <b>depósito</b> ou <b>transferência</b> para começar.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 animate-pulse rounded-md bg-slate-200" />
          <div className="h-4 w-40 animate-pulse rounded-md bg-slate-200" />
        </div>
        <div className="h-8 w-20 animate-pulse rounded-md bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-48 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        <div className="lg:col-span-2 h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}
