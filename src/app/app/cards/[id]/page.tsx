"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import Logo from "@/components/Logo";
import { ShieldBan, ShieldCheck, Ban, BadgePercent, Wallet } from "lucide-react";

type Card = {
  id: string;
  accountId: string;
  type: "DEBIT" | "CREDIT";
  isVirtual: boolean;
  brand: string;
  holderName: string;
  last4: string;
  expMonth: number;
  expYear: number;
  status: "ACTIVE" | "BLOCKED" | "CANCELED";
  creditLimit?: number | null;
  availableCredit?: number | null;
  createdAt: string;
  updatedAt: string;
  account: { number: string; agency: string };
};

function centsToBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function maskMoneyBRL(v: string) {
  const digits = v.replace(/\D/g, "");
  const cents = (parseInt(digits || "0", 10) / 100).toFixed(2);
  const n = Number(cents);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parseMoneyBRLToCents(v: string) {
  const norm = v.replace(/\s|R\$/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(norm || "0");
  return Math.round(n * 100);
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const r = useRouter();
  const [ready, setReady] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ajuste de limite
  const [limitTxt, setLimitTxt] = useState("R$ 0,00");
  const limitCents = useMemo(() => parseMoneyBRLToCents(limitTxt), [limitTxt]);

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) { r.replace("/login"); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const url = new URL("/api/cards/get", window.location.origin);
      url.searchParams.set("cardId", String(id));
      const rs = await fetch(url.toString());
      const j: { ok?: boolean; card?: Card; error?: string } = await rs.json();
      if (!rs.ok || !j.ok || !j.card) { setErr(j.error || "Erro ao carregar cartão."); return; }
      setCard(j.card);
      if (j.card.type === "CREDIT") {
        setLimitTxt(centsToBRL(j.card.creditLimit ?? 0));
      }
      setReady(true);
    } finally {
      setLoading(false);
    }
  }

  async function action(kind: "BLOCK"|"UNBLOCK"|"CANCEL") {
    if (!card) return;
    setLoading(true);
    setErr(null);
    try {
      const rs = await fetch("/api/cards/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, action: kind }),
      });
      const j = await rs.json();
      if (!rs.ok || !j.ok) { setErr(j.error || "Falha ao atualizar estado."); return; }
      setCard(j.card);
    } finally {
      setLoading(false);
    }
  }

  async function saveLimit(e: React.FormEvent) {
    e.preventDefault();
    if (!card || card.type !== "CREDIT") return;
    setLoading(true);
    setErr(null);
    try {
      const rs = await fetch("/api/cards/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, creditLimit: limitCents }),
      });
      const j = await rs.json();
      if (!rs.ok || !j.ok) { setErr(j.error || "Não foi possível salvar limite."); return; }
      setCard(j.card);
    } finally {
      setLoading(false);
    }
  }

  if (!ready || !card) return null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* fundo sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:radial-gradient(80rem_60rem_at_50%_-10%,rgb(16_185_129_/_0.2),transparent_50%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(1200px_600px_at_center,white,transparent)]">
          <div className="h-full w-full bg-[length:28px_28px] bg-[linear-gradient(to_right,rgba(15,23,42,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.06)_1px,transparent_1px)]" />
        </div>
      </div>

      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <a href="/app/cards" className="group inline-flex items-center gap-2">
          <Logo size={24} />
          <span className="text-base font-semibold tracking-tight">
            NovaBank <span className="text-emerald-600">EDU</span>
          </span>
          <span className="ml-2 text-xs text-slate-500 group-hover:underline">voltar</span>
        </a>
      </header>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 pb-16 md:grid-cols-3">
        {/* cartão visual + resumo */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h1 className="text-lg font-semibold">Cartão</h1>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {/* cartão visual */}
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white shadow-md">
                <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/30 blur-2xl" />
                <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-500/20 blur-2xl" />
                <div className="flex items-center justify-between p-4">
                  <div className="text-[13px] font-semibold tracking-wide">{card.brand}</div>
                  <div className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                    {card.isVirtual ? "Virtual" : "Físico"}
                  </div>
                </div>
                <div className="px-4">
                  <div className="mb-2 h-6 w-8 rounded bg-yellow-400/80" />
                  <div className="text-xl tracking-widest">•••• •••• •••• {card.last4}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
                    <span>Val {String(card.expMonth).padStart(2,"0")}/{String(card.expYear).slice(-2)}</span>
                    <span className="opacity-60">|</span>
                    <span className="truncate">{card.holderName}</span>
                  </div>
                </div>
              </div>

              {/* meta */}
              <div className="space-y-2 text-sm">
                <div><b>Tipo:</b> {card.type === "CREDIT" ? "Crédito" : "Débito"} ({card.isVirtual ? "virtual" : "físico"})</div>
                <div><b>Status:</b> {card.status === "ACTIVE" ? "Ativo" : card.status === "BLOCKED" ? "Bloqueado" : "Cancelado"}</div>
                <div><b>Conta:</b> Ag. {card.account.agency} • {card.account.number}</div>
                <div><b>Criado:</b> {new Date(card.createdAt).toLocaleString("pt-BR")}</div>
                {card.type === "CREDIT" && (
                  <div className="pt-1 text-sm">
                    <div><b>Limite:</b> {centsToBRL(card.creditLimit ?? 0)}</div>
                    <div><b>Disponível:</b> {centsToBRL(card.availableCredit ?? 0)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ações */}
            <div className="mt-5 flex flex-wrap gap-2">
              {card.status !== "CANCELED" && card.status !== "BLOCKED" && (
                <button
                  onClick={() => action("BLOCK")}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
                >
                  <ShieldBan className="h-4 w-4" />
                  Bloquear
                </button>
              )}
              {card.status === "BLOCKED" && (
                <button
                  onClick={() => action("UNBLOCK")}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Desbloquear
                </button>
              )}
              {card.status !== "CANCELED" && (
                <button
                  onClick={() => action("CANCEL")}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
                >
                  <Ban className="h-4 w-4" />
                  Cancelar
                </button>
              )}
            </div>

            {err && <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
          </div>
        </div>

        {/* Ajuste de limite + compras (placeholder) */}
        <aside className="space-y-6">
          {/* ajuste limite (apenas crédito) */}
          {card.type === "CREDIT" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-semibold">Ajuste de limite</h2>
              </div>
              <form onSubmit={saveLimit} className="space-y-2">
                <label className="block text-xs font-medium">Limite total</label>
                <input
                  value={limitTxt}
                  onChange={(e)=>setLimitTxt(maskMoneyBRL(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                />
                <button
                  disabled={loading}
                  className="mt-1 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-700" />
                <h2 className="text-sm font-semibold">Cartão de débito</h2>
              </div>
              <p className="text-sm text-slate-600">
                Não possui limite de crédito. As compras debitam do saldo da conta.
              </p>
            </div>
          )}

          {/* compras: placeholder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold">Compras (em breve)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Em breve você poderá acompanhar compras deste cartão e faturas (para crédito).
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
