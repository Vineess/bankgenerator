"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { getSession } from "@/lib/session";
import {
  RefreshCcw,
  PiggyBank,
  TrendingUp,
  Coins,
  Trash2,
  Trash,
} from "lucide-react";

type MeResponse = {
  user: { id: string; name: string };
  account: { id: string; agency: string; number: string; balance: number };
};

type Product = {
  id: string;
  code: string;
  name: string;
  description: string;
  minuteRatePpm: number;
  minAmountCents: number;
  liquidityMinutes: number;
};

type Position = {
  id: string;
  status: "ACTIVE" | "CLOSED";
  openedAt: string;
  closedAt?: string;
  principalCents: number;
  currentCents: number;
  gainCents: number;
  product: {
    id: string;
    name: string;
    code: string;
    minuteRatePpm: number;
    liquidityMinutes: number;
  };
};

function cents(v?: number | null) {
  return ((v ?? 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** ---------------- Tabs (Ativos / Encerrados) ---------------- */
function Tabs({
  tab,
  setTab,
  counts,
}: {
  tab: "ACTIVE" | "CLOSED";
  setTab: (t: "ACTIVE" | "CLOSED") => void;
  counts: { active: number; closed: number };
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 h-9 text-sm ring-1 transition";
  const on = "bg-slate-900 text-white ring-slate-900";
  const off =
    "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 active:bg-slate-100";
  const badge =
    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px]";

  return (
    <div className="inline-flex shrink-0 gap-2 rounded-full bg-slate-100 p-1">
      <button
        onClick={() => setTab("ACTIVE")}
        className={`${base} ${tab === "ACTIVE" ? on : off}`}
      >
        Ativos{" "}
        <span
          className={`${badge} ${
            tab === "ACTIVE" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          {counts.active}
        </span>
      </button>
      <button
        onClick={() => setTab("CLOSED")}
        className={`${base} ${tab === "CLOSED" ? on : off}`}
      >
        Encerrados{" "}
        <span
          className={`${badge} ${
            tab === "CLOSED" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          {counts.closed}
        </span>
      </button>
    </div>
  );
}

/** ---------------- Página ---------------- */
export default function InvestPage() {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  // form buy
  const [sel, setSel] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // filtro de lista
  const [tab, setTab] = useState<"ACTIVE" | "CLOSED">("ACTIVE");

  // tick para atualizar valores por minuto na UI
  useEffect(() => {
    const t = setInterval(() => {
      if (me?.account?.id) loadPositions(me.account.id, false);
    }, 60_000);
    return () => clearInterval(t);
  }, [me?.account?.id]);

  useEffect(() => {
    const s = getSession();
    if (!s?.userId) {
      window.location.href = "/login";
      return;
    }

    (async () => {
      const r = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: s.userId }),
      });
      const json = await r.json();
      if (!r.ok || json?.error) {
        window.location.href = "/login";
        return;
      }
      setMe(json);
      setReady(true);
      await Promise.all([loadProducts(), loadPositions(json.account.id, true)]);
    })();
  }, []);

  async function loadProducts() {
    const r = await fetch("/api/invest/products");
    const j = await r.json();
    if (r.ok && j.ok) setProducts(j.products);
  }

  async function loadPositions(accountId: string, showLoading: boolean) {
    if (showLoading) setLoading(true);
    try {
      const r = await fetch("/api/invest/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const j = await r.json();
      if (r.ok && j.ok) setPositions(j.positions);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  function fmtRate(ppm: number) {
    // exibe em %/min
    return (ppm / 10000).toFixed(2) + "%/min";
  }

  async function onBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.account?.id || !sel || !amount) return;
    const clean = amount.replace(/[^\d]/g, "");
    const centsValue = Number(clean);
    if (!centsValue) return;

    const r = await fetch("/api/invest/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: me.account.id,
        productId: sel,
        amountCents: centsValue,
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error || "Erro ao investir.");
      return;
    }
    setAmount("");
    await loadPositions(me.account.id, true);
    // atualiza saldo consultando /api/me
    const re = await fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.user.id }),
    });
    setMe(await re.json());
  }

  async function onRedeem(id: string) {
    if (!me?.account?.id) return;
    const r = await fetch("/api/invest/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: me.account.id, positionId: id }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error || "Erro ao resgatar.");
      return;
    }
    await loadPositions(me.account.id, true);
    const re = await fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.user.id }),
    });
    setMe(await re.json());
  }

  // excluir posição encerrada
  async function deleteClosedPosition(id: string) {
    if (!me?.user?.id) return;
    if (!confirm("Excluir esta posição ENCERRADA? Essa ação é irreversível.")) return;

    const r = await fetch(`/api/invest/positions/${id}/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.user.id }),
    });
    const j = await r.json();
    if (!r.ok || j?.error) {
      alert(j?.error || "Falha ao excluir.");
      return;
    }
    if (me?.account?.id) await loadPositions(me.account.id, true);
  }

  // limpar todos encerrados
  async function cleanupAllClosed() {
    if (!me?.user?.id) return;
    if (!confirm("Excluir TODAS as posições ENCERRADAS?")) return;

    const r = await fetch("/api/invest/positions/cleanup-closed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: me.user.id }),
    });
    const j = await r.json();
    if (!r.ok || j?.error) {
      alert(j?.error || "Falha ao limpar encerrados.");
      return;
    }
    if (me?.account?.id) await loadPositions(me.account.id, true);
  }

  if (!ready) return null;

  const active = positions.filter((p) => p.status === "ACTIVE");
  const closed = positions.filter((p) => p.status === "CLOSED");
  const list = tab === "ACTIVE" ? active : closed;

  // ---- RESUMOS (ATIVOS) ----
  const investedActive = active.reduce((acc, p) => acc + (p.principalCents || 0), 0);
  const currentActive = active.reduce((acc, p) => acc + (p.currentCents || 0), 0);
  const gainActive = active.reduce((acc, p) => acc + (p.gainCents || 0), 0);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* fundo */}
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

        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white px-3 py-1.5 text-sm ring-1 ring-slate-200">
            Saldo: <b>{cents(me?.account?.balance)}</b>
          </span>
          <button
            onClick={() => me && loadPositions(me.account.id, true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            Recarregar
          </button>
        </div>
      </header>

      {/* conteúdo */}
      <section className="mx-auto grid max-w-4xl gap-6 px-6 pb-16 md:grid-cols-3">
        {/* Comprar */}
        <div className="md:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-slate-700" />
              <h2 className="text-sm font-semibold">Investir</h2>
            </div>

            <form onSubmit={onBuy} className="space-y-3">
              <div>
                <label className="block text-xs font-medium">Produto</label>
                <select
                  value={sel}
                  onChange={(e) => setSel(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} • {fmtRate(p.minuteRatePpm)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium">
                  Valor (centavos ou use máscara BRL se preferir)
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex.: 100000 (= R$ 1.000,00)"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-700"
                />
              </div>

              <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:brightness-110">
                Comprar
              </button>
            </form>

            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
              Rende por minuto (DEMO). No resgate, 1% do <b>ganho</b> é cobrado
              como taxa.
            </div>
          </div>

          {/* produtos */}
          <div className="mt-4 space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {p.description}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <span className="rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                        Taxa: <b>{fmtRate(p.minuteRatePpm)}</b>
                      </span>
                      <span className="rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                        Mín.: <b>{cents(p.minAmountCents)}</b>
                      </span>
                      <span className="rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                        Liquidez: <b>{p.liquidityMinutes} min</b>
                      </span>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-sky-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Posições */}
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* toolbar do card de posições */}
            <div className="mb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Coins className="h-5 w-5 text-slate-700 shrink-0" />
                  <h2 className="truncate text-sm font-semibold">Suas posições</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Tabs
                    tab={tab}
                    setTab={setTab}
                    counts={{ active: active.length, closed: closed.length }}
                  />

                  <button
                    onClick={cleanupAllClosed}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 text-xs font-medium text-rose-700 hover:bg-rose-100 active:bg-rose-200/50"
                    title="Excluir todas as posições ENCERRADAS"
                  >
                    <Trash className="h-4 w-4" />
                    Limpar encerrados
                  </button>

                  <button
                    onClick={() => me && loadPositions(me.account.id, true)}
                    disabled={loading}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Recarregar
                  </button>
                </div>
              </div>
            </div>

            {/* KPIs / Resumo (ATIVOS) */}
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                  Investido (ativos)
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-800">
                  {cents(investedActive)}
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                <div className="text-[11px] uppercase tracking-wide text-emerald-700">
                  Valor atual (ativos)
                </div>
                <div className="mt-1 text-lg font-semibold text-emerald-700">
                  {cents(currentActive)}
                </div>
              </div>
              <div className="rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-200">
                <div className="text-[11px] uppercase tracking-wide text-sky-700">
                  Ganhos (ativos)
                </div>
                <div className="mt-1 text-lg font-semibold text-sky-700">
                  {cents(gainActive)}
                </div>
              </div>
            </div>

            {list.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-600">
                {tab === "ACTIVE"
                  ? "Nenhum investimento ativo."
                  : "Nenhuma posição encerrada."}
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {list.map((pos) => (
                  <li key={pos.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">
                          {pos.product.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Aberto em{" "}
                          {new Date(pos.openedAt).toLocaleString("pt-BR")} •
                          Status:{" "}
                          <b>
                            {pos.status === "ACTIVE" ? "Ativo" : "Encerrado"}
                          </b>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-right text-sm">
                        <div className="rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                          <div className="text-[11px] text-slate-500">
                            Aplicado
                          </div>
                          <div className="font-semibold">
                            {cents(pos.principalCents)}
                          </div>
                        </div>
                        <div className="rounded-md bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                          <div className="text-[11px] text-emerald-700">
                            Atual
                          </div>
                          <div className="font-semibold text-emerald-700">
                            {cents(pos.currentCents)}
                          </div>
                        </div>
                        <div className="rounded-md bg-sky-50 px-3 py-2 ring-1 ring-sky-200">
                          <div className="text-[11px] text-sky-700">Ganho</div>
                          <div className="font-semibold text-sky-700">
                            {cents(pos.gainCents)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {pos.status === "ACTIVE" ? (
                        <button
                          onClick={() => onRedeem(pos.id)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                        >
                          Resgatar
                        </button>
                      ) : (
                        <>
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                            Encerrado em{" "}
                            {pos.closedAt
                              ? new Date(pos.closedAt).toLocaleString("pt-BR")
                              : "-"}
                          </span>
                          <button
                            onClick={() => deleteClosedPosition(pos.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            title="Excluir esta posição encerrada"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
