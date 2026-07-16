import { gates as staticGates, densityLevel, venueContext as staticVenueContext } from '../../data/mockData.js'

/**
 * Scores each gate on multiple weighted factors and returns a ranked
 * recommendation with a transparent reasoning trace, rather than a single
 * "shortest queue" lookup. This is the core "why" behind StadiumMind's
 * recommendations: it's a decision, not a database read.
 *
 * @param {{ needsAccessible?: boolean, gatesOverride?: Array, minutesToKickoffOverride?: number }} opts
 */
export function recommendEntrance(opts = {}) {
  const { needsAccessible = false, gatesOverride, minutesToKickoffOverride } = opts
  const gates = gatesOverride || staticGates
  const minutesToKickoff = minutesToKickoffOverride ?? staticVenueContext.minutesToKickoff
  const urgency = minutesToKickoff <= 20 ? 'high' : minutesToKickoff <= 45 ? 'medium' : 'low'

  const scored = gates.map((g) => {
    // Lower is better. Weights shift when kickoff is imminent (favor speed)
    // vs. when there's time to spare (favor comfort/accessibility).
    const speedWeight = urgency === 'high' ? 0.7 : 0.45
    const walkWeight = urgency === 'high' ? 0.2 : 0.25
    const accessPenalty = needsAccessible && !(g.hasElevator || g.hasRamp) ? 1.5 : 0
    const risingPenalty = g.densityTrend === 'rising' ? 0.15 : 0

    const score =
      g.density * speedWeight +
      (g.walkMin / 15) * walkWeight +
      accessPenalty +
      risingPenalty

    return { ...g, score }
  })

  scored.sort((a, b) => a.score - b.score)
  const best = scored[0]
  const runnerUp = scored[1]

  const reasons = []
  reasons.push(`${best.name} has ${densityLevel(best.density).label.toLowerCase()} crowd density (${Math.round(best.density * 100)}%)`)
  reasons.push(`${best.waitMin} min wait, ${best.walkMin} min walk from the main concourse`)
  if (needsAccessible) {
    reasons.push(best.hasElevator || best.hasRamp ? 'has step-free access' : 'no step-free access — deprioritized')
  }
  if (urgency === 'high') {
    reasons.push(`kickoff is in ${minutesToKickoff} min, so speed was weighted heavily`)
  }
  if (best.densityTrend === 'rising' === false && runnerUp?.densityTrend === 'rising') {
    reasons.push(`${runnerUp.name} is trending toward more congestion, so it was ranked lower`)
  }

  // Confidence reflects how much better the top pick is than the runner-up —
  // a close call is genuinely less certain than a landslide.
  const gap = runnerUp ? runnerUp.score - best.score : 1
  const confidence = Math.max(0.5, Math.min(0.97, 0.6 + gap))

  return {
    recommendation: best.name,
    gateId: best.id,
    reason: reasons.join('; '),
    confidence: Number(confidence.toFixed(2)),
    alternative: runnerUp ? `${runnerUp.name} (${runnerUp.waitMin} min wait, ${runnerUp.walkMin} min walk)` : null,
    urgency,
  }
}
