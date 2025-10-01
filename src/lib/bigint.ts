// src/lib/bigint.ts
/**
 * Converte qualquer BigInt aninhado em Number ao serializar.
 * (Se você for lidar com valores MUITO grandes, troque Number(v) por v.toString()).
 */
export function bigintsToNumbers<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? Number(v) : v))
  );
}
