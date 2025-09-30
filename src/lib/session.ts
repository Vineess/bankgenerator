import { KEYS, type Session } from "./storage";

export function getSession(): Session {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEYS.session);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
export function setSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.session, JSON.stringify(s));
}
export function logout() {
  setSession(null);
}
