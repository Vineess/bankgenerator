// src/lib/money.ts

/** Aplica máscara BRL conforme o usuário digita (digite só números). */
export function maskMoneyBRL(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  const n = Number(digits || "0") / 100;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Converte string mascarada/solta (ex.: "R$ 1.234,56", "1234,56", "1234.56")
 * ou número (em reais) para **centavos** (inteiro).
 */
export function toCents(raw: string | number): number {
  if (typeof raw === "number") return Math.round(raw * 100);

  const s = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")     // remove espaços
    .replace(/^R\$\s?/, "") // remove "R$"
    .replace(/\./g, "")     // milhares
    .replace(",", ".");     // separador decimal

  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

/** Opcional: atalho semântico para desfazer a máscara e obter centavos. */
export const unmaskToCents = toCents;
