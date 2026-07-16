// Vercel serverless function: POST /api/chat
//
// Architecture: Gemini receives the user's message, what StadiumMind already
// remembers about this fan (session memory), and a set of domain "tools"
// (agents). In ONE planning call, Gemini decides whether/which tool(s) are
// needed — including calling MULTIPLE agents together for compound requests.
// We execute the chosen agent(s) locally and send results back.
//
// Self-healing: before executing any tool call, its arguments are validated
// against the tool's schema (src/lib/selfHeal.js). An invalid call is NOT
// silently run or allowed to crash the request — Gemini is told exactly
// what was wrong and given one chance to retry with corrected arguments.
// The whole exchange is capped at 3 model calls total (plan, at most one
// retry round, and a forced text-only close if still unresolved), so a
// malformed call can never turn into an unbounded loop.

import { recommendEntrance } from '../src/lib/agents/navigationAgent.js'
import { assessCrowdRisk } from '../src/lib/agents/crowdAgent.js'
import { planAccessibleRoute } from '../src/lib/agents/accessibilityAgent.js'
import { lookupVenuePolicy } from '../src/lib/agents/venueKnowledgeAgent.js'
import { checkServiceWait } from '../src/lib/agents/operationsAgent.js'
import { validateArgs } from '../src/lib/selfHeal.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'
import { capString } from './_lib/sanitize.js'

const MODEL = 'gemini-2.5-flash'
const MAX_TOOL_ROUNDS = 2

const MEMORY_LABELS = {
  seatBlock: 'seat block',
  accessibilityNeed: 'accessibility need',
  language: 'preferred language',
}

const TOOLS = [
  {
    name: 'recommend_entrance',
    description:
      'Navigation Agent. Recommends the best stadium gate/entrance to use right now, reasoning over live crowd density, walk distance, accessibility needs, and time until kickoff. Use whenever the fan asks about gates, entrances, queues, or "which way should I go".',
    parameters: {
      type: 'OBJECT',
      properties: {
        needsAccessible: { type: 'BOOLEAN', description: 'Whether the fan needs step-free/accessible access' },
      },
    },
  },
  {
    name: 'assess_crowd_risk',
    description:
      'Crowd Intelligence Agent. Checks for congestion or rising-density risk across the venue and suggests a reroute if needed. Use when the fan mentions crowding, a specific gate they are near/heading to, or asks if somewhere is busy — including as a SECOND check alongside recommend_entrance or plan_accessible_route, when timing is tight (e.g. kickoff soon).',
    parameters: {
      type: 'OBJECT',
      properties: {
        currentGateId: { type: 'STRING', description: 'Gate letter the fan is currently at or heading to, if known (e.g. "C")' },
      },
    },
  },
  {
    name: 'plan_accessible_route',
    description:
      'Accessibility Agent. Builds a full accessible-route plan (entrance, restroom, seating help) as one coherent chain, not just a single gate pick. Use for multi-step accessibility questions, or whenever the fan has a known or stated accessibility need.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'lookup_venue_policy',
    description:
      'Venue Knowledge Agent. Looks up ground-truth venue policy/facts (bag policy, re-entry, opening time, parking, wifi, smoking rules) instead of guessing. Use for any factual/policy question about the venue.',
    parameters: {
      type: 'OBJECT',
      properties: {
        topic: { type: 'STRING', enum: ['bagPolicy', 'reEntry', 'openingTime', 'parking', 'wifi', 'smoking'] },
      },
      required: ['topic'],
    },
  },
  {
    name: 'check_service_wait',
    description:
      'Operations Agent. Reports current wait time(s) for concessions, restrooms, merch, or accessible-seating help. Use for any question about a restroom, food, drink, merchandise, or service wait — this does NOT need the fan\'s location, the venue is one concourse.',
    parameters: {
      type: 'OBJECT',
      properties: {
        serviceId: { type: 'STRING', enum: ['concessions', 'restrooms', 'merch', 'accessible-seating'], description: 'Omit to get all services at once' },
      },
    },
  },
  {
    name: 'remember_fact',
    description:
      "Saves a durable fact about this fan for the rest of their visit, so they never have to repeat it. Call this whenever the fan states their seat block/section, an accessibility or mobility need, or a language preference — even if you're also calling another tool in the same turn.",
    parameters: {
      type: 'OBJECT',
      properties: {
        key: { type: 'STRING', enum: ['seatBlock', 'accessibilityNeed', 'language'] },
        value: { type: 'STRING', description: 'Short value to remember, e.g. "Block A" or "wheelchair user"' },
      },
      required: ['key', 'value'],
    },
  },
]

function runTool(name, args) {
  switch (name) {
    case 'recommend_entrance':
      return recommendEntrance(args)
    case 'assess_crowd_risk':
      return assessCrowdRisk(args.currentGateId)
    case 'plan_accessible_route':
      return planAccessibleRoute()
    case 'lookup_venue_policy':
      return lookupVenuePolicy(args.topic)
    case 'check_service_wait':
      return checkServiceWait(args.serviceId)
    case 'remember_fact':
      return { saved: true, key: args.key, value: args.value }
    default:
      return { error: `Unknown tool ${name}` }
  }
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

const KNOWN_MEMORY_KEYS = ['seatBlock', 'accessibilityNeed', 'language']

function memoryToSentence(memory) {
  const entries = Object.entries(memory || {}).filter(([k]) => KNOWN_MEMORY_KEYS.includes(k))
  if (entries.length === 0) return 'Nothing is known about this fan yet.'
  return entries.map(([k, v]) => `${MEMORY_LABELS[k] || k}: ${capString(v, 60, '')}`).join('; ')
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

  const { message, language, memory, history } = req.body || {}
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'Invalid message' })
  }
  const safeLanguage = capString(language, 30, 'English')

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is not configured with an API key' })
  }

  const systemInstruction = {
    parts: [
      {
        text: `You are StadiumMind, the reasoning layer for a FIFA World Cup 2026 venue.
You have tools representing specialized domain agents (navigation, crowd intelligence,
accessibility, venue knowledge) plus a memory tool. Decide which tool(s) are needed —
call MORE THAN ONE in the same turn when a question genuinely spans domains (for example,
an accessibility need combined with a tight kickoff timer should use both
plan_accessible_route AND assess_crowd_risk together, not just one). If no tool is
relevant (small talk, general question), answer directly without calling a tool.

What you already remember about this fan: ${memoryToSentence(memory)}
Use these facts automatically — do not ask the fan to repeat something you already know.
If the fan's message states a NEW durable fact (seat block, accessibility/mobility need,
language preference), call remember_fact for it, even in the same turn as other tools.

Always reply in ${safeLanguage}. Keep the final answer to 2-4 sentences, friendly
and concrete. Do not invent venue policy — use the lookup_venue_policy tool for that.`,
      },
    ],
  }

  const historyContents = (Array.isArray(history) ? history : [])
    .slice(-10)
    .map((h) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: capString(h.text, 2000, '') }] }))
    .filter((h) => h.parts[0].text.length > 0)

  const contents = [...historyContents, { role: 'user', parts: [{ text: message }] }]
  const trace = []
  const failedTools = new Set()

  try {
    let response = await callGemini(apiKey, {
      system_instruction: systemInstruction,
      contents,
      tools: [{ functionDeclarations: TOOLS }],
    })

    let round = 0
    while (round < MAX_TOOL_ROUNDS) {
      const parts = response.candidates?.[0]?.content?.parts || []
      const functionCalls = parts.filter((p) => p.functionCall)
      if (functionCalls.length === 0) break

      round++
      contents.push({ role: 'model', parts: functionCalls })

      const functionResponseParts = functionCalls.map((call) => {
        const name = call.functionCall.name
        const args = call.functionCall.args || {}
        const { valid, errors } = validateArgs(name, args)

        if (!valid) {
          failedTools.add(name)
          trace.push({ agent: name, input: args, output: { error: 'Invalid arguments', errors }, healed: false })
          return {
            functionResponse: {
              name,
              response: { error: 'Invalid arguments — retry this call with corrected arguments.', details: errors },
            },
          }
        }

        const output = runTool(name, args)
        const healed = failedTools.has(name)
        trace.push({ agent: name, input: args, output, healed })
        return { functionResponse: { name, response: output } }
      })

      contents.push({ role: 'user', parts: functionResponseParts })
      response = await callGemini(apiKey, {
        system_instruction: systemInstruction,
        contents,
        tools: [{ functionDeclarations: TOOLS }],
      })
    }

    // Safety valve: if Gemini still wants to call tools after MAX_TOOL_ROUNDS,
    // force a text-only close by omitting `tools` entirely — this guarantees
    // the request terminates at a bounded number of model calls no matter
    // how many times a call fails validation.
    let finalParts = response.candidates?.[0]?.content?.parts || []
    if (finalParts.some((p) => p.functionCall)) {
      response = await callGemini(apiKey, { system_instruction: systemInstruction, contents })
      finalParts = response.candidates?.[0]?.content?.parts || []
    }

    const finalText = finalParts.filter((p) => p.text).map((p) => p.text).join('\n')
    return res.status(200).json({ reply: finalText, reasoning: trace })
  } catch (err) {
    return res.status(500).json({ error: 'Request failed', detail: String(err) })
  }
}
