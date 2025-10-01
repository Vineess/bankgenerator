"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { getSession, logout } from "@/lib/session";
import { cents } from "@/lib/storage";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  Search,
  X,
  CreditCard,
  LineChart,
} from "lucide-react";

type MeResponse = {
  user: { id: string; name: string; cpf: string; createdAt: string };
  account: {
    id: string;
    agency: string;
    number: string;
    balance: number;
    createdAt: string;
  };
};

type TxItem = {
  id: string;
  kind: "DEPOSIT" | "WITHDRAW" | "TRANSFER" | string;
  amount: number;
  createdAt: string;
  note?: string | null;
  fromId?: string | null;
  toId?: string | null;
  from?: { id: string; number: string } | null;
  to?: { id: string; number: string } | null;
};

type KindFilter =
  | "ALL"
  | "IN"
  | "OUT"
  | "DEPOSIT"
  | "WITHDRAW"
  | "TRANSFER";
type PeriodFilter = "7D" | "30D" | "ALL";

/* ---------------- helpers ---------------- */

function kindPt(kind: string, isOut: boolean) {
  if (kind === "DEPOSIT") return "Depósito";
  if (kind === "WITHDRAW") return "Saque";
  return isOut ? "Transferência enviada" : "Transferência recebida";
}

function periodToDays(p: PeriodFilter) {
  if (p === "7D") return 7;
  if (p === "30D") return 30;
  return 0; // ALL
}

/* --------------- component --------------- */

export default function AppHome() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [account, setAccount] = useState<MeResponse["account"] | null>(null);

  // extrato
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);

  // filtros (UI)
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [period, setPeriod] = useState<PeriodFilter>("30D");
  const [q, setQ] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) {
      window.location.href = "/login";
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: s.userId }),
        });
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const json: MeResponse | { error: string } = await res.json();
        if ("error" in json) {
          window.location.href = "/login";
          return;
        }

        setUser(json.user);
        setAccount(json.account);
        setReady(true);

        // carrega extrato inicial já com filtros atuais
        await fetchTx(json.account.id, null, { kind, period, q });
      } catch {
        window.location.href = "/login";
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // quando filtros mudarem, recarrega do zero
  useEffect(() => {
    if (!account) return;
    setTxs([]);
    setNextCursor(null);
    fetchTx(account.id, null, { kind, period, q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, period, q]);

  async function fetchTx(
    accountId: string,
    cursor?: string | null,
    opts?: { kind?: KindFilter; period?: PeriodFilter; q?: string }
  ) {
    setLoadingTx(true);
    try {
      const url = new URL("/api/tx/list", window.location.origin);
      url.searchParams.set("accountId", accountId);
      url.searchParams.set("limit", "12");
      if (cursor) url.searchParams.set("cursor", cursor);

      const k = (opts?.kind ?? kind) as string;
      const p = opts?.period ?? period;
      const qq = (opts?.q ?? q).trim();

      url.searchParams.set("kind", k);
      url.searchParams.set("sinceDays", String(periodToDays(p)));
      if (qq) url.searchParams.set("q", qq);

      const r = await fetch(url.toString());
      const j: {
        ok?: boolean;
        items?: TxItem[];
        nextCursor?: string | null;
      } = await r.json();

      if (!r.ok || !j?.ok || !j.items) return;

      setTxs((prev) => [...prev, ...j.items!]);
      setNextCursor(j.nextCursor ?? null);
    } finally {
      setLoadingTx(false);
    }
  }

  if (!ready) return <LoadingSkeleton />;

  const balanceTxt = cents(account!.balance);
  const firstName = (user!.name ?? "").split(" ")[0] || "Cliente";

  return (
    <main className="relative min-h-screen overflow-hidden">
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
            {firstName.slice(0, 1).toUpperCase()}
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-110"
            aria-label="Sair"
          >
            Sair
          </button>
        </div>
      </header>

      {/* conteúdo */}
      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 pb-16 lg:grid-cols-3">
        {/* saldo */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-sky-400/10 to-indigo-400/10" />
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Saldo disponível
                  </p>
                  <h1 className="mt-1 text-4xl font-semibold tracking-tight text-slate-900">
                    {balanceTxt}
                  </h1>
                  <p className="mt-2 text-xs text-slate-500">
                    Agência <b>{account?.agency}</b> • Conta{" "}
                    <b>{account?.number}</b>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Action href="/app/deposit" label="Depositar" intent="positive" />
                  <Action href="/app/withdraw" label="Sacar" intent="negative" />
                  <Action href="/app/transfer" label="Transferir" intent="primary" />
                </div>
              </div>

              {/* atalhos */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <a
                  href="/app/pix"
                  className="flex items-center gap-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:brightness-105"
                >
                  <ArrowLeftRight className="h-4 w-4 text-emerald-600" />
                  Pix
                </a>
                <Shortcut label="Pagar boleto (em breve)" />

                <a
                  href="/app/cards"
                  className="flex items-center gap-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:brightness-105"
                >
                  <CreditCard className="h-4 w-4 text-slate-600" />
                  Cartões
                </a>

                <a
                  href="/app/invest"
                  className="flex items-center gap-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition hover:brightness-105"
                >
                  <LineChart className="h-4 w-4 text-emerald-600" />
                  Investir
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* info conta + nota educativa */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Sua conta</h3>
            <div className="mt-3 space-y-3 text-sm">
              <InfoRow k="Titular" v={user?.name ?? "-"} />
              <InfoRow k="Agência" v={account?.agency ?? "-"} />
              <InfoRow k="Conta" v={account?.number ?? "-"} />
              <InfoRow
                k="Abertura"
                v={new Date(account?.createdAt ?? Date.now()).toLocaleDateString(
                  "pt-BR"
                )}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
            <p className="font-medium">Ambiente educativo</p>
            <p className="mt-1">
              Este projeto não movimenta dinheiro real e não se conecta a
              instituições financeiras. Use dados fictícios.
            </p>
          </div>
        </aside>

        {/* extrato */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Extrato</h3>
                <span className="text-xs text-slate-500">
                  últimas movimentações
                </span>
              </div>

              {/* filtros */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as KindFilter)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                  title="Tipo"
                >
                  <option value="ALL">Todos os tipos</option>
                  <option value="IN">Entradas</option>
                  <option value="OUT">Saídas</option>
                  <option value="DEPOSIT">Depósitos</option>
                  <option value="WITHDRAW">Saques</option>
                  <option value="TRANSFER">Transferências</option>
                </select>

                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                  title="Período"
                >
                  <option value="7D">Últimos 7 dias</option>
                  <option value="30D">Últimos 30 dias</option>
                  <option value="ALL">Todo período</option>
                </select>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nota/conta"
                    className="w-48 rounded-lg border border-slate-300 bg-white pl-8 pr-7 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                  />
                  {q && (
                    <button
                      onClick={() => setQ("")}
                      className="absolute right-1.5 top-1.5 rounded p-1 text-slate-400 hover:text-slate-600"
                      title="Limpar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* resumo filtros */}
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>
                {txs.length} {txs.length === 1 ? "movimentação" : "movimentações"}
              </span>
              {(kind !== "ALL" || period !== "30D" || q) && (
                <button
                  onClick={() => {
                    setKind("ALL");
                    setPeriod("30D");
                    setQ("");
                  }}
                  className="rounded px-2 py-1 text-slate-600 hover:bg-slate-50"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {txs.length === 0 ? (
              <EmptyStatement />
            ) : (
              <ul className="divide-y divide-slate-100">
                {txs.map((t) => (
                  <TxRow key={t.id} tx={t} selfId={account!.id} />
                ))}
              </ul>
            )}

            <div className="mt-4">
              {nextCursor ? (
                <button
                  onClick={() => fetchTx(account!.id, nextCursor, { kind, period, q })}
                  disabled={loadingTx}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {loadingTx ? "Carregando..." : "Carregar mais"}
                </button>
              ) : (
                txs.length > 0 && (
                  <div className="text-center text-xs text-slate-500">
                    Fim das movimentações
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------------- UI bits ---------------- */

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

function Action({
  href,
  label,
  intent,
}: {
  href: string;
  label: string;
  intent: "primary" | "positive" | "negative";
}) {
  const cls =
    intent === "positive"
      ? "bg-emerald-600 focus:ring-emerald-700"
      : intent === "negative"
      ? "bg-rose-600 focus:ring-rose-700"
      : "bg-sky-600 focus:ring-sky-700";
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
    <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
      <p className="text-sm text-slate-600">
        Nenhuma movimentação por enquanto. Ajuste os filtros ou faça um{" "}
        <b>depósito</b>.
      </p>
    </div>
  );
}

function TxRow({ tx, selfId }: { tx: TxItem; selfId: string }) {
  const isOut =
    tx.fromId === selfId &&
    (tx.kind === "WITHDRAW" || tx.kind === "TRANSFER");
  const sign = isOut ? "-" : "+";

  const color =
    tx.kind === "DEPOSIT"
      ? "text-emerald-600"
      : tx.kind === "WITHDRAW"
      ? "text-rose-600"
      : isOut
      ? "text-rose-600"
      : "text-emerald-600";

  const ring =
    tx.kind === "DEPOSIT"
      ? "ring-emerald-200"
      : tx.kind === "WITHDRAW"
      ? "ring-rose-200"
      : isOut
      ? "ring-rose-200"
      : "ring-emerald-200";

  const iconColor =
    tx.kind === "DEPOSIT"
      ? "text-emerald-600"
      : tx.kind === "WITHDRAW"
      ? "text-rose-600"
      : isOut
      ? "text-rose-600"
      : "text-emerald-600";

  const counterpart = isOut ? tx.to?.number ?? "—" : tx.from?.number ?? "—";
  const titulo = kindPt(tx.kind, isOut);

  const Icon =
    tx.kind === "DEPOSIT"
      ? ArrowDownCircle
      : tx.kind === "WITHDRAW"
      ? ArrowUpCircle
      : ArrowLeftRight;

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        {/* ícone colorido */}
        <div className={`mt-0.5 rounded-full bg-white p-2 ring-1 ${ring}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>

        {/* título + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">
              {titulo}
              {tx.kind === "TRANSFER" ? ` • ${counterpart}` : ""}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {new Date(tx.createdAt).toLocaleString("pt-BR")}
            {tx.note ? ` • ${tx.note}` : null}
          </div>
        </div>
      </div>

      {/* valor */}
      <div className={`shrink-0 text-sm font-semibold ${color}`}>
        {sign}
        {cents(tx.amount)}
      </div>
    </li>
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
