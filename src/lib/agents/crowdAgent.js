import { gates as staticGates, densityLevel } from '../../data/mockData.js'

/**
 * Looks across all gates for congestion risk and produces a reroute
 * recommendation when needed. This is what powers the "proactive" behavior —
 * StadiumMind can raise this without being asked, whenever a fan is
 * heading toward (or already at) a congested gate.
 *
 * @param {string} [currentGateId]
 * @param {Array} [gatesOverride] - pass live-ticking gate data from the
 *   frontend; falls back to the static snapshot (used by the backend agent).
 */
export function assessCrowdRisk(currentGateId, gatesOverride) {
  const gates = gatesOverride || staticGates
  const congested = gates.filter((g) => densityLevel(g.density).tone === 'bad')
  const rising = gates.filter((g) => g.densityTrend === 'rising')

  const current = gates.find((g) => g.id === currentGateId)
  const alternatives = gates
    .filter((g) => g.id !== currentGateId)
    .sort((a, b) => a.density - b.density)

  const shouldReroute = current
    ? densityLevel(current.density).tone === 'bad' || current.densityTrend === 'rising'
    : congested.length > 0

  return {
    congestedGates: congested.map((g) => g.name),
    risingGates: rising.map((g) => g.name),
    shouldReroute,
    suggestedGate: shouldReroute ? alternatives[0]?.name : null,
    reason: shouldReroute
      ? current
        ? `${current.name} is ${densityLevel(current.density).label.toLowerCase()} and trending ${current.densityTrend}`
        : `${congested.map((g) => g.name).join(', ')} ${congested.length > 1 ? 'are' : 'is'} congested`
      : 'No congestion risk detected right now',
  }
}
