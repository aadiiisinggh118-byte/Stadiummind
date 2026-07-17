import { transportOptions as staticOptions } from '../../data/mockData.js'

/**
 * Scores each arrival mode on total time (wait + any delay) and eco-impact,
 * mirroring the same weighted-scoring approach navigationAgent.js uses for
 * gates — a decision with a visible "why," not a lookup. When kickoff is
 * imminent, speed is weighted more heavily; otherwise eco-impact matters
 * more, on the reasoning that a fan with time to spare can reasonably be
 * nudged toward the lower-carbon option.
 *
 * @param {{ needsAccessible?: boolean, minutesToKickoff?: number, optionsOverride?: Array }} opts
 */
export function recommendTransportMode(opts = {}) {
  const { needsAccessible = false, minutesToKickoff = 60, optionsOverride } = opts
  const options = optionsOverride || staticOptions
  const urgency = minutesToKickoff <= 20 ? 'high' : minutesToKickoff <= 45 ? 'medium' : 'low'

  const speedWeight = urgency === 'high' ? 0.75 : urgency === 'medium' ? 0.55 : 0.4
  const ecoWeight = 1 - speedWeight

  // Normalize against the worst case in each dimension so the two weighted
  // factors are comparable regardless of their different units (minutes vs kg).
  const maxTotalTime = Math.max(...options.map((o) => o.waitMin + o.delayMin))
  const maxCo2 = Math.max(...options.map((o) => o.co2PerPersonKg))

  const scored = options.map((o) => {
    const totalTime = o.waitMin + o.delayMin
    const accessPenalty = needsAccessible && !o.accessible ? 1.5 : 0
    const score = (totalTime / maxTotalTime) * speedWeight + (o.co2PerPersonKg / maxCo2) * ecoWeight + accessPenalty
    return { ...o, totalTime, score }
  })

  scored.sort((a, b) => a.score - b.score)
  const best = scored[0]
  const runnerUp = scored[1]

  const reasons = []
  reasons.push(`${best.label} takes about ${best.totalTime} min total`)
  reasons.push(`${best.co2PerPersonKg} kg CO2/person, the ${best.co2PerPersonKg <= maxCo2 / 2 ? 'lower' : 'higher'}-impact end of the options`)
  if (urgency === 'high') {
    reasons.push(`kickoff is in ${minutesToKickoff} min, so speed was weighted heavily`)
  } else {
    reasons.push('there is time to spare, so the eco-impact was weighted more than usual')
  }

  const gap = runnerUp ? runnerUp.score - best.score : 1
  const confidence = Math.max(0.5, Math.min(0.96, 0.6 + gap))

  return {
    recommendation: best.label,
    modeId: best.id,
    reason: reasons.join('; '),
    confidence: Number(confidence.toFixed(2)),
    alternative: runnerUp ? `${runnerUp.label} (${runnerUp.totalTime} min, ${runnerUp.co2PerPersonKg} kg CO2/person)` : null,
    urgency,
  }
}

/**
 * Compares the recommended mode against driving alone, so the eco-impact of
 * that choice is stated in concrete terms rather than an abstract "greener"
 * label.
 */
export function computeSustainabilitySummary(optionsOverride) {
  const options = optionsOverride || staticOptions
  const driving = options.find((o) => o.id === 'parking')
  const lowestImpact = [...options].sort((a, b) => a.co2PerPersonKg - b.co2PerPersonKg)[0]
  if (!driving || !lowestImpact) return null

  const savedKg = Number((driving.co2PerPersonKg - lowestImpact.co2PerPersonKg).toFixed(1))
  return {
    lowestImpactMode: lowestImpact.label,
    comparedToMode: driving.label,
    co2SavedKgPerPerson: savedKg,
    summary: `Choosing ${lowestImpact.label} instead of ${driving.label} saves an estimated ${savedKg} kg of CO2 per person for the trip.`,
  }
}