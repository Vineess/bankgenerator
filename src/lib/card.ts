// Geração fake de cartão p/ DEMO
export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function genLast4() {
  return String(randInt(0, 9999)).padStart(4, "0");
}

export function genExp() {
  const now = new Date();
  const inYears = randInt(2, 5);
  const month = randInt(1, 12);
  return { month, year: now.getFullYear() + inYears };
}

export function genPanToken() {
  // token aleatório só para identificar cartão (não é PAN real)
  return "tok_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
