"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { getSession } from "@/lib/session";
import {
  KeyRound,
  Plus,
  RefreshCcw,
  Star,
  Trash2,
  SendHorizontal,
  Mail,
  Phone,
  Hash,
  IdCard,
  ShieldCheck,
} from "lucide-react";

/* ---------------- types ---------------- */

type MeResp = {
  user: { id: string; name: string };
  account: { id: string; agency: string; number: string };
};
type PixKey = {
  id: string;
  type: "CPF" | "EMAIL" | "PHONE" | "EVP";
  value: string;
  isPrimary: boolean;
  createdAt: string;
};

/* ---------------- helpers ---------------- */

function formatKeyValue(type: PixKey["type"], v: string) {
  if (type === "CPF")
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (type === "PHONE") {
    if (v.length === 11) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length === 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  }
  return v;
}

function maskMoneyBRL(v: string) {
  const digits = v.replace(/\D/g, "");
  const n = (parseInt(digits || "0", 10) / 100).toFixed(2);
  const num = Number(n);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parseBRLToCents(masked: string) {
  const norm = masked.replace(/\s|R\$/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(norm || "0");
  return Math.round(n * 100);
}
function cx(...a: (string | false | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

/* ---------------- page ---------------- */

export default function PixPage() {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<MeResp | null>(null);

  // keys
  const [keys, setKeys] = useState<PixKey[]>([]);
  const [loading, setLoading] = useState(false);

  // create key
  const [openForm, setOpenForm] = useState(false);
  const [type, setType] = useState<PixKey["type"]>("CPF");
  const [value, setValue] = useState("");
  const [setPrimary, setSetPrimary] = useState(false);

  // send pix
  const [sendType, setSendType] = useState<PixKey["type"]>("CPF");
  const [sendKey, setSendKey] = useState("");
  const [sendAmount, setSendAmount] = useState("R$ 0,00");
  const [sendNote, setSendNote] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null
  );

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
      const j = await r.json();
      if (!r.ok || j?.error) {
        window.location.href = "/login";
        return;
      }
      setMe(j);
      setReady(true);
      await loadKeys(j.account.id);
    })();
  }, []);

  async function loadKeys(accountId: string) {
    setLoading(true);
    try {
      const r = await fetch("/api/pix/keys/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const j = await r.json();
      if (r.ok && j.ok) setKeys(j.keys);
    } finally {
      setLoading(false);
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.account?.id) return;

    const r = await fetch("/api/pix/keys/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: me.account.id,
        type,
        value,
        setPrimary,
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      setFlash({ kind: "err", msg: j.error || "Erro ao cadastrar chave." });
      return;
    }
    setOpenForm(false);
    setType("CPF");
    setValue("");
    setSetPrimary(false);
    await loadKeys(me.account.id);
    setFlash({ kind: "ok", msg: "Chave cadastrada com sucesso." });
  }

  async function onDelete(id: string) {
    if (!me?.account?.id) return;
    if (!confirm("Excluir esta chave Pix?")) return;
    const r = await fetch("/api/pix/keys/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId: id, accountId: me.account.id }),
    });
    const j = await r.json();
    if (!r.ok) {
      setFlash({ kind: "err", msg: j.error || "Falha ao excluir." });
      return;
    }
    await loadKeys(me.account.id);
    setFlash({ kind: "ok", msg: "Chave excluída." });
  }

  async function onSetPrimary(id: string) {
    if (!me?.account?.id) return;
    const r = await fetch("/api/pix/keys/set-primary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId: id, accountId: me.account.id }),
    });
    if (r.ok) {
      await loadKeys(me.account.id);
      setFlash({ kind: "ok", msg: "Chave definida como principal." });
    }
  }

  async function onSendPix(e: React.FormEvent) {
    e.preventDefault();
    if (!me?.account?.id) return;

    const amountCents = parseBRLToCents(sendAmount);
    if (!amountCents || amountCents <= 0) {
      setFlash({ kind: "err", msg: "Informe um valor válido." });
      return;
    }

    setSending(true);
    try {
      const r = await fetch("/api/pix/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: me.account.id,
          keyType: sendType,
          key: sendKey,
          amountCents,
          note: sendNote,
        }),
      });
      const j = await r.json();
      if (!r.ok || j?.error) {
        setFlash({ kind: "err", msg: j?.error || "Falha no Pix." });
        return;
      }
      setSendType("CPF");
      setSendKey("");
      setSendAmount("R$ 0,00");
      setSendNote("");
      setFlash({ kind: "ok", msg: "Pix enviado com sucesso!" });
    } finally {
      setSending(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* BG */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:radial-gradient(90rem_70rem_at_50%_-10%,rgb(16_185_129_/_0.18),transparent_55%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(1200px_620px_at_center,white,transparent)]">
          <div className="h-full w-full bg-[length:28px_28px] bg-[linear-gradient(to_right,rgba(15,23,42,.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.05)_1px,transparent_1px)]" />
        </div>
      </div>

      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <a href="/app" className="group inline-flex items-center gap-2">
          <Logo size={24} />
          <span className="text-base font-semibold tracking-tight">
            NovaBank <span className="text-emerald-600">EDU</span>
          </span>
          <span className="ml-2 text-xs text-slate-500 group-hover:underline">
            voltar
          </span>
        </a>

        <button
          onClick={() => me && loadKeys(me.account.id)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCcw className="h-4 w-4" />
          Recarregar
        </button>
      </header>

      {/* Flash message */}
      {flash && (
        <div
          className={cx(
            "mx-auto mb-4 w-[min(90%,56rem)] rounded-lg px-4 py-2 text-sm shadow-sm",
            flash.kind === "ok"
              ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          )}
        >
          {flash.msg}
        </div>
      )}

      {/* Content */}
      <section className="mx-auto grid w-[min(90%,56rem)] grid-cols-1 gap-6 pb-16 md:grid-cols-[340px,1fr]">
        {/* MINHAS CHAVES */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-slate-700" />
                <h2 className="text-sm font-semibold">Minhas chaves Pix</h2>
              </div>
              <button
                onClick={() => setOpenForm((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Nova chave
              </button>
            </div>

            {/* Lista */}
            {keys.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
                Você ainda não tem chaves cadastradas.
              </div>
            ) : (
              <ul className="space-y-3">
                {keys.map((k) => {
                  const icon =
                    k.type === "CPF"
                      ? IdCard
                      : k.type === "EMAIL"
                      ? Mail
                      : k.type === "PHONE"
                      ? Phone
                      : Hash;
                  const Icon = icon;
                  return (
                    <li
                      key={k.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{k.type}</span>
                            {k.isPrimary && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                                <ShieldCheck className="h-3 w-3" />
                                Principal
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-slate-500">
                            {formatKeyValue(k.type, k.value)}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {!k.isPrimary && (
                          <button
                            onClick={() => onSetPrimary(k.id)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Tornar principal
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(k.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Form de nova chave */}
          {openForm && (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
              <form onSubmit={onCreate} className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="CPF">CPF</option>
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Telefone</option>
                      <option value="EVP">Chave aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium">
                      Valor {type === "EVP" ? "(gerado automaticamente)" : "(obrigatório)"}
                    </label>
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      disabled={type === "EVP"}
                      placeholder={
                        type === "CPF"
                          ? "000.000.000-00"
                          : type === "PHONE"
                          ? "(11) 99999-9999"
                          : type === "EMAIL"
                          ? "email@exemplo.com"
                          : "gerado automaticamente"
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800 disabled:bg-slate-100"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={setPrimary}
                      onChange={(e) => setSetPrimary(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    Definir como chave principal
                  </label>

                  <button className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:brightness-110">
                    Salvar chave
                  </button>
                </div>
              </form>
            </div>
          )}
        </aside>

        {/* ENVIAR PIX */}
        <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
          {/* Header com gradiente */}
          <div className="mb-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-transparent p-4 ring-1 ring-emerald-200/40">
            <div className="flex items-center gap-2">
              <SendHorizontal className="h-5 w-5 text-emerald-700" />
              <h2 className="text-sm font-semibold text-slate-800">Enviar Pix</h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Informe a chave de destino, o valor e (opcionalmente) uma observação.
            </p>
          </div>

          <form onSubmit={onSendPix} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-medium">Tipo de chave</label>
                <div className="relative mt-1">
                  <select
                    value={sendType}
                    onChange={(e) => setSendType(e.target.value as any)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
                  >
                    <option value="CPF">CPF</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Telefone</option>
                    <option value="EVP">Chave aleatória (EVP)</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {sendType === "CPF" ? (
                      <IdCard className="h-4 w-4" />
                    ) : sendType === "EMAIL" ? (
                      <Mail className="h-4 w-4" />
                    ) : sendType === "PHONE" ? (
                      <Phone className="h-4 w-4" />
                    ) : (
                      <Hash className="h-4 w-4" />
                    )}
                  </span>
                </div>
              </div>

              {/* Chave */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium">Chave destino</label>
                <input
                  value={sendKey}
                  onChange={(e) => setSendKey(e.target.value)}
                  placeholder={
                    sendType === "CPF"
                      ? "000.000.000-00"
                      : sendType === "PHONE"
                      ? "(11) 99999-9999"
                      : sendType === "EMAIL"
                      ? "email@exemplo.com"
                      : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Valor */}
              <div>
                <label className="block text-xs font-medium">Valor</label>
                <input
                  value={sendAmount}
                  onChange={(e) => setSendAmount(maskMoneyBRL(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {["R$ 20,00", "R$ 50,00", "R$ 100,00"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setSendAmount(chip)}
                      className="rounded-full bg-slate-50 px-2.5 py-1 text-xs ring-1 ring-slate-200 hover:bg-slate-100"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observação */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium">
                  Observação (opcional)
                </label>
                <input
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                  maxLength={140}
                  placeholder="Ex.: Aluguel, almoço, etc."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-60"
              >
                <SendHorizontal className="h-4 w-4" />
                {sending ? "Enviando..." : "Enviar Pix"}
              </button>
              <span className="text-xs text-slate-500">
                O envio confere saldo e normaliza a chave automaticamente.
              </span>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
