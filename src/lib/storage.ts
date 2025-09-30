// 🔑 Somente a chave de sessão é usada no modo com Postgres.
export const KEYS = {
  session: "bankgen_session",
} as const;

// Sessão simples gravada no navegador.
// (O dado do usuário/conta é sempre buscado no backend via /api/me.)
export type Session = { userId: string } | null;

// Utilidades genéricas de localStorage (aqui usamos só para a sessão).
export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Formata centavos -> BRL (ex.: 12345 -> "R$ 123,45")
export function cents(v: number) {
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
