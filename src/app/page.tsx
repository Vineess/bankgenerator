import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* fundo com grade sutil + radial */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background:radial-gradient(80rem_60rem_at_50%_-10%,rgb(16_185_129_/_0.25),transparent_50%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(1200px_600px_at_center,white,transparent)]">
          <div className="h-full w-full bg-[length:32px_32px] bg-[linear-gradient(to_right,rgba(15,23,42,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,.08)_1px,transparent_1px)]" />
        </div>
      </div>

      {/* navbar */}
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="text-lg font-semibold tracking-tight">
            NovaBank <span className="text-emerald-600">EDU</span>
          </span>
        </div>
        <span className="rounded-full border border-emerald-200/70 bg-white/70 px-3 py-1 text-xs text-emerald-800 backdrop-blur">
          Projeto de estudos
        </span>
      </header>

      {/* hero */}
      <section className="mx-auto mt-8 max-w-4xl px-6 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Seu “banco” fictício para praticar{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
              cadastro e autenticação
            </span>
          </h1>
          <p className="mt-3 text-pretty text-sm text-slate-600">
            Simule a criação de conta por <b>nome + CPF + senha</b> e acesse uma
            interface bancária simples (saldo, ações básicas). Sem dados reais. Sem
            dinheiro de verdade.
          </p>
        </div>

        {/* card glass */}
        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/50 bg-white/60 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-emerald-100 p-2">
              <Logo size={22} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-medium">Comece agora</h2>
              <p className="mt-1 text-sm text-slate-600">
                Crie uma conta bancária fictícia e acesse o app.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  Criar conta
                </a>
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-slate-800"
                >
                  Entrar
                </a>
                <span className="ml-2 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200 backdrop-blur">
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  Persistência em PostgreSQL (Prisma) — ambiente educativo.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* features */}
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          <Feature
            title="Conta & Agência"
            desc="Geração automática de agência e número de conta com DV simples."
          />
          <Feature
            title="Login + Backend"
            desc="Autenticação com APIs Next.js, hash com bcryptjs e dados no PostgreSQL (Prisma)."
          />
          <Feature
            title="Interface simples"
            desc="Saldo e ações básicas, ideal para portfólio e estudos (UI estilo fintech)."
          />
        </div>
      </section>

      {/* rodapé */}
      <footer className="mx-auto w-full max-w-4xl px-6 pb-10 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} NovaBank EDU — Projeto open-source para fins
        educativos. Não use dados reais.
      </footer>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-slate-600">{desc}</p>
    </div>
  );
}
