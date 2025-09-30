export function onlyDigits(v: string) {
  return (v ?? "").replace(/\D/g, "");
}

export function isValidCPFStrict(cpfRaw: string) {
  const s = onlyDigits(cpfRaw);
  if (s.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(s)) return false;
  const calc = (base: string, factorStart: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (factorStart - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = calc(s.slice(0, 9), 10);
  const d2 = calc(s.slice(0, 10), 11);
  return d1 === parseInt(s[9], 10) && d2 === parseInt(s[10], 10);
}

export function looksLikeCPF(cpfRaw: string) {
  const s = onlyDigits(cpfRaw);
  return s.length === 11 && !/^(\d)\1{10}$/.test(s);
}

export const DEMO_MODE = true;
export function validateCPF(cpfRaw: string) {
  return DEMO_MODE ? looksLikeCPF(cpfRaw) : isValidCPFStrict(cpfRaw);
}
