// Vercel serverless function: POST /api/incident
//
// Emergency Agent workflow: classify → determine urgency → generate
// volunteer instructions + user instructions → estimate response time →
// return a structured incident. Gemini is used for exactly one thing:
// personalizing the fan-facing message (tone, language) from the structured
// classification. The classification itself stays deterministic/auditable
// rather than left to free-form generation — you don't want an LLM
// hallucinating urgency in a real emergency flow.

import { classifyIncident, VALID_INCIDENT_REASONS } from '../src/lib/agents/emergencyAgent.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'
import { capString, isOneOf } from './_lib/sanitize.js'

const MODEL = 'gemini-2.5-flash'

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

  const { reason, note, language } = req.body || {}
  if (!isOneOf(reason, VALID_INCIDENT_REASONS)) {
    return res.status(400).json({ error: 'Invalid reason', allowed: VALID_INCIDENT_REASONS })
  }
  const safeNote = capString(note, 500, '')
  const safeLanguage = capString(language, 30, 'English')

  const incident = classifyIncident(reason, safeNote)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Degrade gracefully: the workflow still functions without Gemini,
    // just with the template instructions instead of a personalized message.
    return res.status(200).json({ incident, message: incident.userInstructions })
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
                text: `You are StadiumMind's emergency response voice. Reply in ${safeLanguage}.
Given a structured incident classification, write a short (1-3 sentence), calm, reassuring
message directly to the fan. Never contradict the given urgency, ETA, or instructions —
only adapt tone and phrasing.`,
              },
            ],
          },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(incident) }] }],
        }),
      }
    )

    if (!response.ok) {
      return res.status(200).json({ incident, message: incident.userInstructions })
    }

    const data = await response.json()
    const parts = data.candidates?.[0]?.content?.parts || []
    const message = parts.filter((p) => p.text).map((p) => p.text).join('\n') || incident.userInstructions
    return res.status(200).json({ incident, message })
  } catch {
    return res.status(200).json({ incident, message: incident.userInstructions })
  }
}
