// Vercel serverless function: POST /api/lost-child
//
// The search plan itself (where to look, how urgently) is deterministic —
// you don't want an LLM improvising search radius in a real emergency.
// Gemini's job is exactly one thing: turning that structured plan into a
// calm, clear status update for the parent. This endpoint is called once at
// intake and again each time the search stage changes (immediate ->
// expanding -> escalated), not on every second of the timer.

import { planLostChildSearch } from '../src/lib/agents/lostChildAgent.js'
import { gates } from '../src/data/mockData.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'
import { capString, isOneOf, clampNumber } from './_lib/sanitize.js'

const MODEL = 'gemini-2.5-flash'
const VALID_GATE_IDS = gates.map((g) => g.id)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = getClientIp(req)
  const rl = checkRateLimit(ip)
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSeconds))
    return res.status(429).json({ error: 'Too many requests — please slow down.' })
  }
  res.setHeader('X-Content-Type-Options', 'nosniff')

  const { age, description, lastSeenGateId, elapsedSeconds, language } = req.body || {}
  if (!isOneOf(lastSeenGateId, VALID_GATE_IDS)) {
    return res.status(400).json({ error: 'Invalid lastSeenGateId', allowed: VALID_GATE_IDS })
  }
  const safeElapsed = clampNumber(elapsedSeconds, 0, 21600, null) // capped at 6h, a generous real-world bound
  if (safeElapsed === null) {
    return res.status(400).json({ error: 'Invalid elapsedSeconds' })
  }
  const safeAge = capString(age, 20, '')
  const safeDescription = capString(description, 300, '')
  const safeLanguage = capString(language, 30, 'English')

  const plan = planLostChildSearch({ lastSeenGateId, elapsedSeconds: safeElapsed })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(200).json({ plan, message: plan.action })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: `You are StadiumMind's lost-child response coordinator. Reply in ${safeLanguage}.
Given a structured search plan (JSON), write a short (2-3 sentence), calm, clear status
update directly to the parent. Never invent details not present in the plan — only
rephrase what's given (stage, action, priority gates). Do not minimize the situation, but
stay steady and reassuring. If a child's age or description was provided, you may
acknowledge it was logged, but do not invent anything about the child.`,
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: JSON.stringify({ age: safeAge || null, description: safeDescription || null, plan }) }],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      return res.status(200).json({ plan, message: plan.action })
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    const message = parts.filter((p) => p.text).map((p) => p.text).join('\n') || plan.action
    return res.status(200).json({ plan, message })
  } catch {
    return res.status(200).json({ plan, message: plan.action })
  }
}
