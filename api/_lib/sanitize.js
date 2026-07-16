// Lightweight input hardening shared by every API route. Every piece of
// user-controlled text that ends up inside a Gemini prompt gets capped and
// type-checked here first, so a malicious or buggy client can't inflate
// token costs, destabilize a request, or smuggle an oversized payload in
// through a field that "looks" harmless (e.g. `language`, `note`, `memory`).

export function capString(value, maxLen, fallback = '') {
  if (typeof value !== 'string') return fallback
  return value.slice(0, maxLen)
}

export function isOneOf(value, allowed) {
  return typeof value === 'string' && allowed.includes(value)
}

export function clampNumber(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}
