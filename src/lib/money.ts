export function toCents(raw: string | number) {
  if (typeof raw === "number") return Math.round(raw * 100);
  // aceita "123,45" ou "123.45"
  const s = String(raw).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (Number.isNaN(n) || n <= 0) return 0;
  return Math.round(n * 100);
}
