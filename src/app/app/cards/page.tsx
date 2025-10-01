"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import Logo from "@/components/Logo";
import {
  CreditCard,
  ScanLine,
  Plus,
  RefreshCcw,
} from "lucide-react";

type MeResponse = {
  user: { id: string; name: string };
  account: { id: string; agency: string; number: string };
};

type CardItem = {
  id: string;
  type: "DEBIT" | "CREDIT";
  isVirtual: boolean;
  brand: string;
  holderName: string;
  last4: string;
  expMonth: number;
  expYear: number;
  status: "ACTIVE" | "BLOCKED" | "CANCELED";
  creditLimit?: number | null;     // centavos
  availableCredit?: number | null; // centavos
  createdAt: string;
};

/* ---------------- helpers ---------------- */

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
function statusBadge(s: CardItem["status"]) {
  if (s === "ACTIVE") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (s === "BLOCKED") return "bg-amber-50 text-amber-800 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-rose-200";
}

/* --------------- small UI pieces --------------- */

function RowMoney({
  label,
  value,
  accent = false,
}: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={`text-xs ${accent ? "text-slate-700" : "text-slate-500"}`}>{label}</span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          accent ? "text-emerald-700" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* --------------- page component --------------- */

export default function CardsPage() {
  const r = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [account, setAccount] = useState<MeResponse["account"] | null>(null);

  const [cards, setCards] = useState<CardItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // form
  const [openForm, setOpenForm] = useState(false);
  const [fType, setFType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [fVirtual, setFVirtual] = useState(false);
  const [fBrand, setFBrand] = useState("VISA");
  const [fHolder, setFHolder] = useState("");
  const [fLimitTxt, setFLimitTxt] = useState("R$ 0,00");
  const fLimitCents = useMemo(() => parseMoneyBRLToCents(fLimitTxt), [fLimitTxt]);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) { r.replace("/login"); return; }

    (async () => {
      try {
        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: s.userId }),
        });
        const json: any = await res.json();
        if (!res.ok || json?.error) { r.replace("/login"); return; }
        setUser(json.user);
        setAccount(json.account);
        setFHolder(json.user?.name ?? "");
        setReady(true);
        await loadCards(json.account.id);
      } catch {
        r.replace("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCards(accountId: string) {
    setLoadingList(true);
    try {
      const url = new URL("/api/cards/list", window.location.origin);
      url.searchParams.set("accountId", accountId);
      const rs = await fetch(url.toString());
      const j: { ok?: boolean; cards?: CardItem[] } = await rs.json();
      if (rs.ok && j.ok && j.cards) setCards(j.cards);
    } finally {
      setLoadingList(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!account) return;

    if (fType === "CREDIT" && fLimitCents <= 0) {
      setErr("Defina um limite de crédito maior que zero.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cards/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          type: fType,
          isVirtual: fVirtual,
          brand: fBrand,
          holderName: fHolder || user?.name,
          creditLimit: fType === "CREDIT" ? fLimitCents : undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok || j?.error) {
        setErr(j.error || "Erro ao criar cartão.");
        return;
      }
      // reset e recarrega
      setOpenForm(false);
      setFType("DEBIT");
      setFVirtual(false);
      setFBrand("VISA");
      setFHolder(user?.name ?? "");
      setFLimitTxt("R$ 0,00");
      await loadCards(account.id);
    } catch {
      setErr("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* BG sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:radial-gradient(80rem_60rem_at_50%_-10%,rgb(16_185_129_/_0.2),transparent_50%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(1200px_600px_at_center,white,transparent)]">
          <div className="h-full w-full bg-[length:28px_28px] bg-[linear-gradient(to_right,rgba(15,23,42,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.06)_1px,transparent_1px)]" />
        </div>
      </div>

      {/* header */}
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <a href="/app" className="group inline-flex items-center gap-2">
          <Logo size={24} />
          <span className="text-base font-semibold tracking-tight">
            NovaBank <span className="text-emerald-600">EDU</span>
          </span>
          <span className="ml-2 text-xs text-slate-500 group-hover:underline">voltar</span>
        </a>

        <button
          onClick={() => account && loadCards(account.id)}
          disabled={loadingList}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          title="Recarregar"
        >
          <RefreshCcw className="h-4 w-4" />
          Recarregar
        </button>
      </header>

      {/* content */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Seus cartões</h1>
                <button
                  onClick={() => setOpenForm(v => !v)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  Novo cartão
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-600">
                  Nenhum cartão ainda. Clique em <b>Novo cartão</b> para criar seu primeiro.
                </div>
              ) : (
                <ul className="space-y-4">
                  {cards.map((c) => (
                    <li key={c.id}>
                      <a
                        href={`/app/cards/${c.id}`}
                        className="block overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          {/* Cartão visual */}
                          <div className="relative w-full shrink-0 sm:w-[320px]">
                            <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white shadow-md">
                              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/30 blur-2xl" />
                              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-500/20 blur-2xl" />

                              <div className="flex items-center justify-between p-4">
                                <div className="text-[13px] font-semibold tracking-wide">{c.brand}</div>
                                <div className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                                  {c.isVirtual ? "Virtual" : "Físico"}
                                </div>
                              </div>

                              <div className="px-4">
                                <div className="mb-2 h-6 w-8 rounded bg-yellow-400/80" />
                                <div className="text-lg tracking-widest">•••• •••• •••• {c.last4}</div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
                                  <span>Val {String(c.expMonth).padStart(2, "0")}/{String(c.expYear).slice(-2)}</span>
                                  <span className="opacity-60">|</span>
                                  <span className="truncate">{c.holderName}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Metadados à direita */}
                          <div className="min-w-0 flex-1 break-words">
                            {/* título + badges */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold">
                                {c.type === "CREDIT" ? "Crédito" : "Débito"} ({c.isVirtual ? "virtual" : "físico"})
                              </span>
                              <span className="text-xs text-slate-500">• {c.brand}</span>

                              {c.isVirtual && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200">
                                  <ScanLine className="h-3 w-3" /> Virtual
                                </span>
                              )}

                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${statusBadge(
                                  c.status
                                )}`}
                              >
                                {c.status === "ACTIVE"
                                  ? "Ativo"
                                  : c.status === "BLOCKED"
                                  ? "Bloqueado"
                                  : "Cancelado"}
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-slate-500">
                              criado em {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                            </div>

                            {/* Disponível (topo) + Limite (embaixo), valores à direita */}
                            {c.type === "CREDIT" && (
                              <div className="mt-3 w-full max-w-sm rounded-xl bg-slate-50/70 p-3 ring-1 ring-slate-200">
                                <RowMoney label="Disponível" value={centsToBRL(c.availableCredit ?? 0)} accent />
                                <div className="my-1 h-px w-full bg-slate-200/80" />
                                <RowMoney label="Limite" value={centsToBRL(c.creditLimit ?? 0)} />
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Formulário de criação */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-semibold">Novo cartão</h2>
              </div>

              {!openForm ? (
                <p className="text-sm text-slate-600">
                  Clique em <b>Novo cartão</b> para abrir o formulário.
                </p>
              ) : (
                <form onSubmit={onCreate} className="mt-2 space-y-3">
                  {err && (
                    <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {err}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium">Tipo</label>
                      <select
                        value={fType}
                        onChange={e => setFType(e.target.value as any)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                      >
                        <option value="DEBIT">Débito</option>
                        <option value="CREDIT">Crédito</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Bandeira</label>
                      <select
                        value={fBrand}
                        onChange={e => setFBrand(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                      >
                        <option>VISA</option>
                        <option>MASTERCARD</option>
                        <option>ELO</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="virtual"
                      type="checkbox"
                      checked={fVirtual}
                      onChange={e => setFVirtual(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <label htmlFor="virtual" className="text-sm">Cartão virtual</label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium">Nome do titular</label>
                    <input
                      value={fHolder}
                      onChange={e => setFHolder(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                      placeholder="Nome impresso no cartão"
                    />
                  </div>

                  {fType === "CREDIT" && (
                    <div>
                      <label className="block text-xs font-medium">Limite do cartão</label>
                      <input
                        value={fLimitTxt}
                        onChange={e => setFLimitTxt(maskMoneyBRL(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Valor total do limite (ex.: R$ 3.000,00).
                      </p>
                    </div>
                  )}

                  <div className="pt-1">
                    <button
                      disabled={submitting}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
                    >
                      {submitting ? "Criando..." : "Criar cartão"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-medium">Nota</p>
              <p className="mt-1">
                Projeto educativo: não armazenamos dados sensíveis do cartão. Apenas
                <b> last4</b> e um <b>token</b> interno.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
