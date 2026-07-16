import { gates as staticGates, gateAdjacency, densityLevel } from '../../data/mockData.js'

// Escalation thresholds. Real-world these would be minutes; kept as seconds
// here so the workflow is demoable in a live presentation without waiting.
const STAGE_2_AT = 120 // 2 min
const STAGE_3_AT = 300 // 5 min

export function getStage(elapsedSeconds) {
  if (elapsedSeconds >= STAGE_3_AT) return 'escalated'
  if (elapsedSeconds >= STAGE_2_AT) return 'expanding'
  return 'immediate'
}

const STAGE_COPY = {
  immediate: {
    label: 'Immediate area search',
    action: (gateName) => `Searching the concourse immediately around ${gateName}, where the child was last seen.`,
  },
  expanding: {
    label: 'Expanding search radius',
    action: (gateName, adjacentNames) =>
      `No sighting yet near ${gateName} — expanding the search to adjacent gates (${adjacentNames.join(', ')}) and issuing a concourse announcement.`,
  },
  escalated: {
    label: 'Venue-wide escalation',
    action: () =>
      `Still not located — escalating to a venue-wide alert. Security has been engaged and every gate volunteer is now searching, prioritized by current crowd density.`,
  },
}

/**
 * Plans the search response for a lost-child report. The reasoning that
 * matters here: WHERE to search first (last-seen gate, then neighbors, then
 * everywhere) and HOW HARD (denser gates get priority once the search goes
 * venue-wide, since a child is more likely to be swept along in a crowd).
 *
 * @param {{ lastSeenGateId: string, elapsedSeconds: number, gatesOverride?: Array }} input
 */
export function planLostChildSearch({ lastSeenGateId, elapsedSeconds, gatesOverride }) {
  const gates = gatesOverride || staticGates
  const stage = getStage(elapsedSeconds)
  const lastSeenGate = gates.find((g) => g.id === lastSeenGateId) || gates[0]
  const adjacentIds = gateAdjacency[lastSeenGate.id] || []
  const adjacentGates = gates.filter((g) => adjacentIds.includes(g.id))

  let priorityGates
  let action
  if (stage === 'immediate') {
    priorityGates = [lastSeenGate]
    action = STAGE_COPY.immediate.action(lastSeenGate.name)
  } else if (stage === 'expanding') {
    priorityGates = [lastSeenGate, ...adjacentGates]
    action = STAGE_COPY.expanding.action(lastSeenGate.name, adjacentGates.map((g) => g.name))
  } else {
    // Venue-wide: search busiest gates first — a child is more likely to
    // have been carried along by a dense crowd than to be somewhere empty.
    priorityGates = [...gates].sort((a, b) => b.density - a.density)
    action = STAGE_COPY.escalated.action()
  }

  const reasoning =
    stage === 'immediate'
      ? `Reported ${elapsedSeconds}s ago — starting at the last confirmed location before widening the search.`
      : stage === 'expanding'
        ? `${elapsedSeconds}s elapsed with no sighting — radius expanded to gates adjacent to ${lastSeenGate.name}.`
        : `${elapsedSeconds}s elapsed — search is now venue-wide, ordered by live crowd density (${priorityGates[0].name} is currently ${densityLevel(priorityGates[0].density).label.toLowerCase()}, searched first).`

  return {
    stage,
    stageLabel: STAGE_COPY[stage].label,
    urgency: 'critical',
    action,
    reasoning,
    priorityGates: priorityGates.map((g) => ({ id: g.id, name: g.name, density: g.density })),
    elapsedSeconds,
  }
}
