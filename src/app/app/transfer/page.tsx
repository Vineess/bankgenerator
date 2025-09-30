"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { toCents } from "@/lib/money";

export default function TransferPage() {
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) { window.location.href = "/login"; return; }
    fetch("/api/me", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: s.userId }),
    })
      .then(r => r.json())
      .then(j => { if (j?.error) location.href="/login"; else setFromAccountId(j.account.id); })
      .catch(() => location.href="/login");
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null);
    const cents = toCents(amount);
    if (!cents) return setErr("Informe um valor válido (ex.: 25,00).");
    if (!fromAccountId) return setErr("Conta de origem não carregada.");
    if (!toAccountNumber) return setErr("Informe a conta de destino (ex.: 402141-2).");

    setLoading(true);
    try {
      const res = await fetch("/api/tx/transfer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAccountId, toAccountNumber, amount: cents, note }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) return setErr(json?.error ?? "Falha na transferência.");
      setOk("Transferência enviada!");
      setAmount(""); setNote(""); setToAccountNumber("");
      setTimeout(() => (window.location.href = "/app"), 900);
    } catch { setErr("Erro inesperado."); }
    finally { setLoading(false); }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Bg />

      <section className="mx-auto max-w-xl px-6 py-10">
        <Header title="Transferir" subtitle="Envie valores para outra conta" color="sky" />

        <div className="mt-6 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-md">
          <form onSubmit={onSubmit} className="space-y-4">
            {err && <Alert kind="error" msg={err} />}
            {ok && <Alert kind="success" msg={ok} />}
            <Field label="Conta destino (ex.: 402141-2)">
              <input
                value={toAccountNumber}
                onChange={(e)=>setToAccountNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-600"
                placeholder="402141-2"
              />
            </Field>
            <Field label="Valor (ex.: 25,00)">
              <input
                value={amount}
                onChange={(e)=>setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-600"
                placeholder="25,00"
              />
            </Field>
            <Field label="Observação (opcional)">
              <input
                value={note}
                onChange={(e)=>setNote(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-600"
                placeholder="Ex.: pagamento"
              />
            </Field>

            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={loading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Processando..." : "Confirmar transferência"}
              </button>
              <a href="/app" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Voltar
              </a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

/* shared bits */
function Header({ title, subtitle, color }:{title:string; subtitle:string; color:"emerald"|"sky"|"rose"}) {
  const from = color==="sky" ? "from-sky-500" : color==="rose" ? "from-rose-500" : "from-emerald-500";
  const to   = color==="sky" ? "to-indigo-400" : color==="rose" ? "to-pink-400" : "to-teal-400";
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        <span className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent`}>{title}</span>
      </h1>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}
function Field({ label, children }:{label:string; children:React.ReactNode}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Alert({ kind, msg }:{kind:"error"|"success"; msg:string}) {
  const cls = kind==="error"
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return <p className={`rounded-md border px-3 py-2 text-sm ${cls}`}>{msg}</p>;
}
function Bg() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 [background:radial-gradient(80rem_60rem_at_50%_-10%,rgb(14_165_233_/_0.16),transparent_50%)]" />
      <div className="absolute inset-0 [mask-image:radial-gradient(1200px_600px_at_center,white,transparent)]">
        <div className="h-full w-full bg-[length:28px_28px] bg-[linear-gradient(to_right,rgba(15,23,42,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.06)_1px,transparent_1px)]" />
      </div>
    </div>
  );
}
