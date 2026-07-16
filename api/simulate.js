// Vercel serverless function: POST /api/simulate
//
// This is the "Planner Agent" for the Digital Twin. The simulation timeline
// and the candidate actions (with their confidence/recovery numbers) are
// already fully computed client-side by the deterministic simulation engine
// (src/lib/agents/simulationAgent.js) before this endpoint is ever called —
// nothing about "what happens" is decided by an LLM.
//
// What Gemini is used for here is narrow and specific: (1) reuse the
// EXISTING domain agents (Navigation, Accessibility, Crowd Intelligence)
// against the simulated final state to get their real, independent, and
// sometimes conflicting opinions, and (2) one bounded Gemini call that
// explains WHY each deterministic candidate action matters given the
// specific simulated numbers, and writes a short cascading-consequence
// narrative. Gemini is not permitted to invent a new action or a new
// number — it can only narrate the ones the engine already computed,
// enforced via a strict JSON response schema.

import { recommendEntrance } from '../src/lib/agents/navigationAgent.js'
import { assessCrowdRisk } from '../src/lib/agents/crowdAgent.js'
import { recommendActions, SCENARIOS } from '../src/lib/agents/simulationAgent.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'
import { capString, isOneOf } from './_lib/sanitize.js'

const MODEL = 'gemini-2.5-flash'

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    narrative: { type: 'string' },
    actionExplanations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          why: { type: 'string' },
        },
        required: ['id', 'why'],
      },
    },
  },
  required: ['narrative', 'actionExplanations'],
}

async function callGemini(apiKey, body) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function fallbackNarrative(scenario, finalState) {
  return `${scenario.label} was simulated for 6 minutes. By the end, stadium health dropped to ${finalState.metrics.healthScore}/100, with safety risk at ${finalState.metrics.safetyRisk}% and emergency response efficiency at ${finalState.metrics.emergencyResponseEfficiency}%.`
}

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

  const { scenarioId, finalGates, finalMetrics, language } = req.body || {}
  if (!isOneOf(scenarioId, Object.keys(SCENARIOS))) {
    return res.status(400).json({ error: 'Invalid scenarioId', allowed: Object.keys(SCENARIOS) })
  }
  if (!Array.isArray(finalGates) || finalGates.length === 0 || !finalMetrics) {
    return res.status(400).json({ error: 'Invalid simulation state' })
  }
  const safeLanguage = capString(language, 30, 'English')
  const scenario = SCENARIOS[scenarioId]
  const finalState = { gates: finalGates, metrics: finalMetrics }

  // Run the EXISTING domain agents against the simulated final state —
  // these are the same Navigation, Accessibility, and Crowd Intelligence
  // Agents used everywhere else in the app, not new logic.
  const navResult = recommendEntrance({ gatesOverride: finalGates })
  const accessResult = recommendEntrance({ needsAccessible: true, gatesOverride: finalGates })
  const crowdResult = assessCrowdRisk(undefined, finalGates)
  const actions = recommendActions(scenarioId, finalState)

  const agentOpinions = { navResult, accessResult, crowdResult }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(200).json({
      narrative: fallbackNarrative(scenario, finalState),
      agentOpinions,
      actions: actions.map((a) => ({ ...a, why: 'AI narration unavailable — server has no API key configured.' })),
    })
  }

  const prompt = `Scenario: ${scenario.label}
Final simulated state after 6 minutes: ${JSON.stringify(finalState)}
Navigation Agent's independent recommendation: ${JSON.stringify(navResult)}
Accessibility Agent's independent recommendation: ${JSON.stringify(accessResult)}
Crowd Intelligence Agent's assessment: ${JSON.stringify(crowdResult)}
Candidate actions (do not invent new ones, do not change their numbers): ${JSON.stringify(actions)}

Write a short (3-5 sentence) cascading-consequence narrative explaining what happens and why,
grounded ONLY in the numbers given above. Then, for each candidate action by its id, write one
sentence explaining why it matters given these specific simulated numbers. Reply in ${safeLanguage}.`

  try {
    const response = await callGemini(apiKey, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    })

    const parts = response.candidates?.[0]?.content?.parts || []
    const rawText = parts.map((p) => p.text || '').join('')
    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch {
      parsed = null
    }

    if (!parsed || !parsed.narrative || !Array.isArray(parsed.actionExplanations)) {
      return res.status(200).json({
        narrative: fallbackNarrative(scenario, finalState),
        agentOpinions,
        actions: actions.map((a) => ({ ...a, why: 'The action is expected to reduce the simulated risk in this scenario.' })),
      })
    }

    const explanationById = Object.fromEntries(parsed.actionExplanations.map((e) => [e.id, e.why]))
    const annotatedActions = actions.map((a) => ({
      ...a,
      why: explanationById[a.id] || 'The action is expected to reduce the simulated risk in this scenario.',
    }))

    return res.status(200).json({ narrative: parsed.narrative, agentOpinions, actions: annotatedActions })
  } catch (err) {
    return res.status(200).json({
      narrative: fallbackNarrative(scenario, finalState),
      agentOpinions,
      actions: actions.map((a) => ({ ...a, why: 'AI narration failed — showing the deterministic recommendation only.' })),
    })
  }
}
