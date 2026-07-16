import { gates as staticGates, gateAdjacency } from '../../data/mockData.js'

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function densityToWait(density) {
  return Math.round(2 + density * 14)
}

// Each scenario is a "shock profile": how fast crowd density rises per
// simulated minute, and how it affects four operational metrics. These
// numbers are deliberately simple and transparent (not a fabricated physics
// engine) — the point is that every number in the UI traces back to a rule
// you can read right here, not something invented at request-time by an LLM.
export const SCENARIOS = {
  heavyRain: {
    label: 'Heavy Rain',
    icon: '🌧️',
    epicenterGateId: null,
    closeEpicenter: false,
    gateDensityDeltaPerMin: 0.03,
    volunteerWorkloadDeltaPerMin: 4,
    emergencyResponseEfficiencyDeltaPerMin: -2,
    accessibilityImpactDeltaPerMin: 3,
    safetyRiskDeltaPerMin: 2,
  },
  gateClosure: {
    label: 'Gate Closure',
    icon: '🚧',
    epicenterGateId: 'B',
    closeEpicenter: true,
    gateDensityDeltaPerMin: 0.005,
    volunteerWorkloadDeltaPerMin: 5,
    emergencyResponseEfficiencyDeltaPerMin: -3,
    accessibilityImpactDeltaPerMin: 2,
    safetyRiskDeltaPerMin: 3,
  },
  medicalSurge: {
    label: 'Medical Emergency Surge',
    icon: '🚑',
    epicenterGateId: 'C',
    closeEpicenter: false,
    gateDensityDeltaPerMin: 0.02,
    volunteerWorkloadDeltaPerMin: 8,
    emergencyResponseEfficiencyDeltaPerMin: -6,
    accessibilityImpactDeltaPerMin: 1,
    safetyRiskDeltaPerMin: 5,
  },
  powerOutage: {
    label: 'Power Outage',
    icon: '⚡',
    epicenterGateId: null,
    closeEpicenter: false,
    gateDensityDeltaPerMin: 0.04,
    volunteerWorkloadDeltaPerMin: 6,
    emergencyResponseEfficiencyDeltaPerMin: -8,
    accessibilityImpactDeltaPerMin: 6,
    safetyRiskDeltaPerMin: 9,
  },
  securityIncident: {
    label: 'Security Incident',
    icon: '🛡️',
    epicenterGateId: 'A',
    closeEpicenter: false,
    gateDensityDeltaPerMin: 0.02,
    volunteerWorkloadDeltaPerMin: 7,
    emergencyResponseEfficiencyDeltaPerMin: -5,
    accessibilityImpactDeltaPerMin: 2,
    safetyRiskDeltaPerMin: 10,
  },
  crowdSurge: {
    label: 'Crowd Surge After Kickoff',
    icon: '📈',
    epicenterGateId: null,
    closeEpicenter: false,
    gateDensityDeltaPerMin: 0.05,
    volunteerWorkloadDeltaPerMin: 6,
    emergencyResponseEfficiencyDeltaPerMin: -3,
    accessibilityImpactDeltaPerMin: 3,
    safetyRiskDeltaPerMin: 4,
  },
  transportDelay: {
    label: 'Public Transport Delay',
    icon: '🚌',
    epicenterGateId: 'D',
    closeEpicenter: false,
    gateDensityDeltaPerMin: 0.025,
    volunteerWorkloadDeltaPerMin: 3,
    emergencyResponseEfficiencyDeltaPerMin: -1,
    accessibilityImpactDeltaPerMin: 2,
    safetyRiskDeltaPerMin: 1,
  },
  lostChildPeak: {
    label: 'Lost Child During Peak Congestion',
    icon: '🧒',
    epicenterGateId: 'C',
    closeEpicenter: false,
    gateDensityDeltaPerMin: 0.03,
    volunteerWorkloadDeltaPerMin: 7,
    emergencyResponseEfficiencyDeltaPerMin: -4,
    accessibilityImpactDeltaPerMin: 1,
    safetyRiskDeltaPerMin: 6,
  },
}

const BASELINE_METRICS = {
  volunteerWorkload: 40,
  emergencyResponseEfficiency: 85,
  accessibilityImpact: 10,
  safetyRisk: 15,
}

/**
 * Composite 0-100 "stadium health" score. Higher is better. Every input is
 * an already-computed metric, so this is just a transparent weighted sum —
 * intentionally readable rather than a black box.
 */
export function computeHealthScore(metrics, gates) {
  const avgDensity = gates.reduce((sum, g) => sum + g.density, 0) / gates.length
  const congestionPenalty = avgDensity * 40
  const workloadPenalty = (metrics.volunteerWorkload / 100) * 15
  const responsePenalty = (1 - metrics.emergencyResponseEfficiency / 100) * 20
  const accessPenalty = (metrics.accessibilityImpact / 100) * 10
  const riskPenalty = (metrics.safetyRisk / 100) * 15
  const score = 100 - congestionPenalty - workloadPenalty - responsePenalty - accessPenalty - riskPenalty
  return Math.round(clamp(score, 0, 100))
}

/**
 * Runs a scenario forward from the current gate state for `ticks` simulated
 * minutes, returning a full timeline. Gate closures redistribute load to
 * adjacent gates (via the real gate-adjacency map, same one the Lost Child
 * Agent uses) rather than every gate reacting identically — that's the
 * "cascading" part.
 */
export function runSimulation(scenarioId, initialGates, ticks = 6) {
  const scenario = SCENARIOS[scenarioId]
  if (!scenario) throw new Error(`Unknown scenario "${scenarioId}"`)

  const startingGates = (initialGates || staticGates).map((g) => ({ ...g }))
  let gates = startingGates
  let metrics = { ...BASELINE_METRICS }

  const timeline = [
    { minute: 0, gates: gates.map((g) => ({ ...g })), metrics: { ...metrics, healthScore: computeHealthScore(metrics, gates) } },
  ]

  if (scenario.closeEpicenter && scenario.epicenterGateId) {
    gates = gates.map((g) => (g.id === scenario.epicenterGateId ? { ...g, closed: true, density: 1, waitMin: 99 } : g))
  }

  for (let minute = 1; minute <= ticks; minute++) {
    gates = gates.map((g) => {
      if (g.closed) return g
      let delta = scenario.gateDensityDeltaPerMin
      if (scenario.epicenterGateId === g.id) delta *= 2.2

      const closedNeighbors = (gateAdjacency[g.id] || []).filter((nId) => gates.find((x) => x.id === nId)?.closed).length
      delta += closedNeighbors * 0.06

      const density = clamp(g.density + delta, 0.05, 0.99)
      return { ...g, density, waitMin: densityToWait(density) }
    })

    metrics = {
      volunteerWorkload: clamp(metrics.volunteerWorkload + scenario.volunteerWorkloadDeltaPerMin, 0, 100),
      emergencyResponseEfficiency: clamp(metrics.emergencyResponseEfficiency + scenario.emergencyResponseEfficiencyDeltaPerMin, 0, 100),
      accessibilityImpact: clamp(metrics.accessibilityImpact + scenario.accessibilityImpactDeltaPerMin, 0, 100),
      safetyRisk: clamp(metrics.safetyRisk + scenario.safetyRiskDeltaPerMin, 0, 100),
    }

    timeline.push({
      minute,
      gates: gates.map((g) => ({ ...g })),
      metrics: { ...metrics, healthScore: computeHealthScore(metrics, gates) },
    })
  }

  return timeline
}

/**
 * Compares two consecutive timeline states and returns alerts for any
 * threshold crossed between them. This is what powers autonomous
 * monitoring during playback — no question was asked, the system just
 * notices.
 */
export function detectThresholdAlerts(state, prevState) {
  const alerts = []

  if (state.metrics.safetyRisk >= 60 && (!prevState || prevState.metrics.safetyRisk < 60)) {
    alerts.push({ id: 'safety-risk', tone: 'danger', text: `Safety risk crossed 60% at minute ${state.minute} — security escalation recommended.` })
  }
  if (state.metrics.emergencyResponseEfficiency <= 50 && (!prevState || prevState.metrics.emergencyResponseEfficiency > 50)) {
    alerts.push({ id: 'response-efficiency', tone: 'warn', text: `Emergency response efficiency dropped below 50% at minute ${state.minute}.` })
  }
  if (state.metrics.healthScore <= 40 && (!prevState || prevState.metrics.healthScore > 40)) {
    alerts.push({ id: 'health-score', tone: 'danger', text: `Stadium health score dropped below 40 at minute ${state.minute}.` })
  }

  const prevCongestedIds = prevState ? prevState.gates.filter((g) => g.density >= 0.85).map((g) => g.id) : []
  state.gates
    .filter((g) => g.density >= 0.85 && !prevCongestedIds.includes(g.id))
    .forEach((g) => {
      alerts.push({ id: `congestion-${g.id}-${state.minute}`, tone: 'warn', text: `${g.name} became congested at minute ${state.minute}.` })
    })

  return alerts
}

// Deterministic candidate actions per scenario. An LLM is only ever asked
// to explain WHY one of these matters given the simulated numbers — never
// to invent a new action or a confidence/recovery number from scratch.
const ACTION_LIBRARY = {
  heavyRain: [
    { id: 'open-indoor-route', text: 'Open indoor concourse route from the main entrance', impactMagnitude: 15 },
    { id: 'deploy-rain-volunteers', text: 'Deploy 4 additional volunteers to guide fans indoors', impactMagnitude: 10 },
  ],
  gateClosure: [
    { id: 'deploy-gate-d', text: 'Deploy 6 volunteers to Gate D to manage redirected flow', impactMagnitude: 12 },
    { id: 'open-overflow', text: 'Open a temporary overflow entrance near Gate C', impactMagnitude: 18 },
    { id: 'push-reroute-notification', text: 'Push a rerouting notification to fans approaching Gate B', impactMagnitude: 8 },
  ],
  medicalSurge: [
    { id: 'request-ambulance', text: 'Request additional ambulance staging near Gate C', impactMagnitude: 20 },
    { id: 'clear-medical-lane', text: 'Clear a dedicated medical access lane', impactMagnitude: 15 },
  ],
  powerOutage: [
    { id: 'activate-backup-lighting', text: 'Activate backup lighting and generators', impactMagnitude: 25 },
    { id: 'manual-elevator-support', text: 'Station volunteers at elevators for manual assistance', impactMagnitude: 20 },
  ],
  securityIncident: [
    { id: 'engage-security', text: 'Engage the security team directly at Gate A', impactMagnitude: 22 },
    { id: 'temporary-lockdown', text: 'Temporary lockdown of the affected concourse section', impactMagnitude: 15 },
  ],
  crowdSurge: [
    { id: 'open-overflow-crowd', text: 'Open an overflow entrance to relieve pressure', impactMagnitude: 14 },
    { id: 'delay-kickoff', text: 'Delay kickoff by 5 minutes to ease congestion', impactMagnitude: 20 },
  ],
  transportDelay: [
    { id: 'extend-gate-hours', text: 'Extend Gate D staffing to handle late arrivals', impactMagnitude: 10 },
    { id: 'accessible-transport-support', text: 'Increase accessible transport support near Gate D', impactMagnitude: 12 },
  ],
  lostChildPeak: [
    { id: 'prioritize-search-volunteers', text: 'Prioritize the volunteer search team at Gate C first', impactMagnitude: 18 },
    { id: 'pa-announcement', text: 'Issue a PA announcement with the child\'s description', impactMagnitude: 10 },
  ],
}

/**
 * Attaches a deterministic confidence and recovery-time estimate to each
 * candidate action for a scenario, based on the simulated severity. Confidence
 * scales with both the action's inherent impact and how bad things got — a
 * bigger fire justifies more confidence in reaching for a bigger response.
 */
export function recommendActions(scenarioId, finalState) {
  const candidates = ACTION_LIBRARY[scenarioId] || []
  const severity = finalState.metrics.safetyRisk
  return candidates.map((action) => {
    const confidence = clamp(0.55 + action.impactMagnitude / 100 + severity / 300, 0.5, 0.97)
    const estimatedRecoveryMin = Math.max(2, Math.round(8 - action.impactMagnitude / 5))
    return { ...action, confidence: Number(confidence.toFixed(2)), estimatedRecoveryMin }
  })
}
