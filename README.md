# NovaBank EDU — Banco Fictício para Estudos

> **Atenção:** projeto **100% educativo**. Não use dados reais. Não movimenta dinheiro real e **não** se conecta a instituições financeiras.

Aplicação full‑stack para portfólio com:

* Registro por **Nome + CPF + Senha**
* **Login** e sessão leve no navegador
* **Conta** com agência/número, **saldo** e (em breve) **extrato**
* UI moderna (Tailwind v4, estética “fintech”)
* Persistência em **PostgreSQL** via **Prisma**

---

## 🧱 Stack

* **Next.js** (App Router, TypeScript)
* **Tailwind CSS v4**
* **Prisma** (ORM)
* **PostgreSQL** (pgAdmin opcional p/ gerenciar)
* **bcryptjs** (hash de senha no backend)

---

## 👀 Preview

Landing e dashboard “fintech” com glass, gradiente e atalhos.
O extrato será populado quando implementarmos depósitos/saques/transferências.

---

## ✅ Requisitos

* **Node.js** 18+ (recomendado 20+)
* **npm** 9+ (ou pnpm/yarn)
* **PostgreSQL** local (banco recomendado: `testes`)
* **pgAdmin** (opcional)

---

## ⚙️ Configuração

### 1) Clonar e instalar

```bash
git clone <seu-repo>
cd <seu-repo>
npm i
```

### 2) Variáveis de ambiente (`.env`)

Crie um arquivo `.env` na raiz com:

```env
DATABASE_URL="postgresql://postgres:SENHA@localhost:5432/testes?schema=public"
```

> Ajuste usuário, senha, host e porta conforme seu ambiente.

### 3) Prisma (schema e migração)

O schema está em `prisma/schema.prisma` (models `User`, `Account`, `Transaction`).

Gere o client e aplique a migração inicial:

```bash
npx prisma generate
npx prisma migrate dev -n "init_db"
```

Opcional — inspecionar o banco com Prisma Studio:

```bash
npx prisma studio
```

### 4) Tailwind v4 (sem PostCSS)

* `src/app/globals.css` **deve conter**:

```css
@import "tailwindcss";
```

* `src/app/layout.tsx` **deve importar** `./globals.css`.

### 5) Rodar o projeto

```bash
npm run dev
# http://localhost:3000
```

---

## 🔐 Fluxo da aplicação

* **`/register`**: cria usuário e conta no Postgres.

  * Validação de CPF em **modo DEMO** (aceita qualquer sequência de 11 dígitos que **não** seja toda igual).
  * Senha é hasheada no servidor com **bcryptjs**.
* **`/login`**: autentica CPF + senha consultando o DB.

  * Sessão leve gravada em `localStorage` (`bankgen_session`).
* **`/app`**: dashboard.

  * Carrega dados via **`POST /api/me`** (backend consulta o Postgres).
  * Exibe saldo, agência/conta, atalhos e (por enquanto) placeholder do extrato.

---

## 🧩 Endpoints

### `POST /api/register`

**Body**

```json
{ "name": "string", "cpf": "string", "password": "string" }
```

**Retorno**

```json
{ "ok": true, "user": { ... }, "account": { ... } }
```

### `POST /api/login`

**Body**

```json
{ "cpf": "string", "password": "string" }
```

**Retorno**

```json
{ "ok": true, "user": { ... }, "account": { ... } }
```

### `POST /api/me`

**Body**

```json
{ "userId": "string" }
```

**Retorno**

```json
{ "user": { ... }, "account": { ... } }
```

> Todas as rotas usam **`export const runtime = "nodejs"`** e acessam o DB via **Prisma**.

---

## 🗂️ Estrutura (resumo)

```
src/
  app/
    api/
      login/route.ts
      me/route.ts
      register/route.ts
    app/page.tsx          # dashboard (UI fintech)
    login/page.tsx
    register/page.tsx
    layout.tsx
    globals.css
  components/
    Logo.tsx
  lib/
    prisma.ts
    storage.ts            # modo DB: sessão + helper cents()
    session.ts
    cpf.ts                # validação (DEMO e estrita)
prisma/
  schema.prisma
```

---

## 🧪 Scripts úteis

```bash
npm run dev                         # inicia em desenvolvimento
npm run build                       # build de produção
npm run start                       # inicia build de produção
npx prisma migrate dev -n "<msg>"   # cria/aplica migração
npx prisma studio                   # GUI do Prisma
```

---

## 🧮 Modo de validação do CPF

* **DEMO (padrão)**: aceita qualquer CPF com 11 dígitos que **não** sejam todos iguais.
* **Estrito**: usa o algoritmo oficial (dígitos verificadores).

Controle em `src/lib/cpf.ts`:

```ts
export const DEMO_MODE = true;  // DEMO
// mude para false para forçar validação estrita
```

---

## 🛠️ Dicas & Troubleshooting

**Estilos não carregam (Tailwind)**

* Confirme `@import "tailwindcss";` em `globals.css`.
* Limpe cache do Next: `rm -rf .next && npm run dev`.
* Reinicie o TypeScript Server no VS Code (Command Palette).

**Erro com `bcrypt` (tipos/compilação)**

* Prefira **bcryptjs**:

  ```bash
  npm remove bcrypt
  npm i bcryptjs
  ```
* Garanta `export const runtime = "nodejs"` nas rotas.

**Prisma P1012 (relations)**

* Em `Account`, confirme:

  ```prisma
  txsFrom Transaction[] @relation("TxFrom")
  txsTo   Transaction[] @relation("TxTo")
  ```
* Em `Transaction`, confirme `from`/`to` com os mesmos nomes de relação.

**Não redireciona para o dashboard após login**

* Remova `src/middleware.ts` se restou algo do NextAuth antigo.
* Use `setSession({ userId })` e `router.replace("/app")` no login/registro.

---

## 🗺️ Roadmap

* [ ] **Depósito / Saque / Transferência** (persistindo em `Transaction`)
* [ ] Extrato com paginação e filtros
* [ ] Máscara de CPF e moeda no front
* [ ] (Opcional) NextAuth + JWT (em vez de sessão localStorage)

---

## 📜 Licença

MIT — use à vontade para fins educacionais/portfólio.

---

**Made with ♥ — NovaBank EDU**
