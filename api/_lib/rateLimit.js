// Simple in-memory sliding-window rate limiter, scoped to one serverless
// function instance. Honest limitation: on Vercel, each instance has its
// own memory and cold starts reset it, so this is NOT a substitute for a
// distributed limiter (e.g. Upstash Redis, Vercel KV) in a real production
// deployment. What it DOES do, realistically: throttle a single client
// hammering the endpoint within a warm instance, which is the actual
// threat model that matters for a hackathon-scale deployment (protecting
// the Gemini API budget from a runaway loop or accidental spam-click, not
// defending against a distributed attack).

const WINDOW_MS = 60_000
const MAX_REQUESTS = 20

const hits = new Map() // ip -> array of request timestamps

export function checkRateLimit(ip) {
  const now = Date.now()
  const key = ip || 'unknown'
  const timestamps = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)

  if (timestamps.length >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - timestamps[0])
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  // Bounded cleanup so the map can't grow unbounded across many distinct IPs.
  if (hits.size > 500) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t > WINDOW_MS)) hits.delete(k)
    }
  }

  return { allowed: true }
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}
