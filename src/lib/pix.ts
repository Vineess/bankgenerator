// src/lib/pix.ts
import { onlyDigits, isValidCPFStrict } from "@/lib/cpf";

/**
 * Toggle: se true, aceita QUALQUER sequência de 11 dígitos como CPF Pix.
 * Se false, exige CPF válido pelo algoritmo oficial.
 */
const LAX_PIX_CPF = true;

export type PixKeyType = "CPF" | "EMAIL" | "PHONE" | "EVP";

/**
 * Normaliza e valida uma chave Pix de acordo com o tipo informado.
 * Lança erro com mensagem amigável quando inválida.
 */
export function normalizePixKey(type: PixKeyType, raw: string) {
  const v = String(raw ?? "").trim();

  switch (type) {
    case "CPF": {
      const s = onlyDigits(v);

      // Aceitar qualquer 11 dígitos (ex.: 00000000036)
      if (s.length !== 11) {
        throw new Error("CPF inválido para Pix (use 11 dígitos).");
      }

      // Caso queira voltar ao modo estrito, troque LAX_PIX_CPF para false
      if (!LAX_PIX_CPF && !isValidCPFStrict(s)) {
        throw new Error("CPF inválido para Pix.");
      }

      return s;
    }

    case "PHONE": {
      // Aceitamos telefone BR sem +55, com DDD: 10 (fixo) ou 11 (celular com 9)
      const s = onlyDigits(v);
      if (s.length < 10 || s.length > 11) {
        throw new Error("Telefone inválido (use DDD e número).");
      }
      return s;
    }

    case "EMAIL": {
      const s = v.toLowerCase();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
      if (!ok) throw new Error("Email inválido.");
      return s;
    }

    case "EVP": {
      // Chave aleatória (tipo UUID). Para demo, aceitamos 10–64 chars alfanum./hífen.
      const s = v.toLowerCase();
      const ok = /^[a-z0-9-]{10,64}$/.test(s);
      if (!ok) throw new Error("Chave aleatória inválida.");
      return s;
    }

    default:
      throw new Error("Tipo de chave não suportado.");
  }
}

/** Gera uma chave EVP “uuid-like” (suficiente para ambiente de estudos). */
export function genEVP(): string {
  return crypto.randomUUID();
}
