"use client";

import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/Logo";
import { getSession, logout } from "@/lib/session";
import { cents } from "@/lib/storage";

export default function AppHome() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [account, setAccount] = useState<any>(null);

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) { window.location.href = "/login"; return; }

    fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: s.userId }),
    })
      .then(r => r.json())
      .then(json => {
        if (json?.error) { window.location.href = "/login"; return; }
        setUser(json.user);
        setAccount(json.account);
        setReady(true);
      })
      .catch(() => { window.location.href = "/login"; });
  }, []);

  const balanceTxt = useMemo(() => cents(account?.balance ?? 0), [account]);

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-semibold">NovaBank <span className="text-emerald-600">EDU</span></span>
        </div>
        <button
          onClick={() => { logout(); window.location.href = "/"; }}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
        >
          Sair
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Olá, {user?.name}</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Info label="Agência" value={account?.agency ?? "-"} />
          <Info label="Conta" value={account?.number ?? "-"} />
          <Info label="Saldo" value={balanceTxt} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href="/app/deposit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110">Depositar</a>
          <a href="/app/withdraw" className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110">Sacar</a>
          <a href="/app/transfer" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110">Transferir</a>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
