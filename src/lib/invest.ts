// taxa em ppm (parts per million) -> fator por minuto
export function minuteRateToFactor(ppm: number) {
  return 1 + ppm / 1_000_000; // ex.: 800 ppm => 1.0008
}

// capitalização composta por minutos inteiros
export function compoundByMinutes(
  principalCents: number,
  minuteRatePpm: number,
  minutesElapsed: number
) {
  if (minutesElapsed <= 0) return principalCents;
  const factor = minuteRateToFactor(minuteRatePpm);
  const value = principalCents * Math.pow(factor, minutesElapsed);
  return Math.floor(value); // em centavos
}

// diferença em minutos entre duas datas
export function diffMinutes(fromISO: string | Date, toISO: string | Date) {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  return Math.max(0, Math.floor((to - from) / 60000));
}
