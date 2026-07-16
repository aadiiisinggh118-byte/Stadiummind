import { describe, it, expect } from 'vitest'
import { runSimulation, computeHealthScore, detectThresholdAlerts, recommendActions, SCENARIOS } from './simulationAgent.js'

const sampleGates = [
  { id: 'A', name: 'Gate A — North', density: 0.35, waitMin: 3, walkMin: 6, hasElevator: true, hasRamp: true, densityTrend: 'steady' },
  { id: 'B', name: 'Gate B — East', density: 0.62, waitMin: 9, walkMin: 4, hasElevator: false, hasRamp: true, densityTrend: 'rising' },
  { id: 'C', name: 'Gate C — South', density: 0.88, waitMin: 14, walkMin: 2, hasElevator: true, hasRamp: false, densityTrend: 'rising' },
  { id: 'D', name: 'Gate D — West', density: 0.28, waitMin: 2, walkMin: 9, hasElevator: true, hasRamp: true, densityTrend: 'falling' },
]

describe('runSimulation', () => {
  it('produces a timeline with one entry per minute plus the baseline', () => {
    const timeline = runSimulation('heavyRain', sampleGates, 6)
    expect(timeline).toHaveLength(7) // minute 0 through 6
    expect(timeline[0].minute).toBe(0)
    expect(timeline[6].minute).toBe(6)
  })

  it('throws on an unknown scenario id', () => {
    expect(() => runSimulation('not-a-real-scenario', sampleGates)).toThrow()
  })

  it('closes the epicenter gate for gateClosure and keeps it closed', () => {
    const timeline = runSimulation('gateClosure', sampleGates, 3)
    const gateB = timeline[timeline.length - 1].gates.find((g) => g.id === 'B')
    expect(gateB.closed).toBe(true)
  })

  it('redistributes load to gates adjacent to a closure, increasing their density over the baseline', () => {
    const timeline = runSimulation('gateClosure', sampleGates, 6)
    const baselineA = timeline[0].gates.find((g) => g.id === 'A').density
    const finalA = timeline[timeline.length - 1].gates.find((g) => g.id === 'A').density
    // Gate A is adjacent to Gate B (the closed epicenter), so its density
    // should rise due to redistribution, not just its own small baseline drift.
    expect(finalA).toBeGreaterThan(baselineA)
  })

  it('keeps every metric within 0-100 bounds across a long run', () => {
    const timeline = runSimulation('powerOutage', sampleGates, 6)
    for (const state of timeline) {
      expect(state.metrics.safetyRisk).toBeGreaterThanOrEqual(0)
      expect(state.metrics.safetyRisk).toBeLessThanOrEqual(100)
      expect(state.metrics.healthScore).toBeGreaterThanOrEqual(0)
      expect(state.metrics.healthScore).toBeLessThanOrEqual(100)
    }
  })

  it('has all 8 required scenarios defined', () => {
    expect(Object.keys(SCENARIOS)).toHaveLength(8)
  })
})

describe('computeHealthScore', () => {
  it('scores a calm baseline higher than a high-risk state', () => {
    const calm = { volunteerWorkload: 20, emergencyResponseEfficiency: 95, accessibilityImpact: 5, safetyRisk: 5 }
    const crisis = { volunteerWorkload: 90, emergencyResponseEfficiency: 30, accessibilityImpact: 70, safetyRisk: 90 }
    const calmScore = computeHealthScore(calm, sampleGates)
    const crisisScore = computeHealthScore(crisis, sampleGates)
    expect(calmScore).toBeGreaterThan(crisisScore)
  })
})

describe('detectThresholdAlerts', () => {
  it('fires a safety-risk alert only on the minute it crosses the threshold, not every minute after', () => {
    const before = { minute: 3, metrics: { safetyRisk: 55, emergencyResponseEfficiency: 80, healthScore: 70 }, gates: sampleGates }
    const crossing = { minute: 4, metrics: { safetyRisk: 65, emergencyResponseEfficiency: 80, healthScore: 65 }, gates: sampleGates }
    const stillHigh = { minute: 5, metrics: { safetyRisk: 68, emergencyResponseEfficiency: 80, healthScore: 60 }, gates: sampleGates }

    const alertsAtCrossing = detectThresholdAlerts(crossing, before)
    const alertsAfter = detectThresholdAlerts(stillHigh, crossing)

    expect(alertsAtCrossing.some((a) => a.id === 'safety-risk')).toBe(true)
    expect(alertsAfter.some((a) => a.id === 'safety-risk')).toBe(false)
  })

  it('flags a gate that newly became congested', () => {
    const before = { minute: 0, metrics: { safetyRisk: 10, emergencyResponseEfficiency: 90, healthScore: 90 }, gates: sampleGates }
    const congestedGates = sampleGates.map((g) => (g.id === 'D' ? { ...g, density: 0.9 } : g))
    const after = { minute: 1, metrics: { safetyRisk: 10, emergencyResponseEfficiency: 90, healthScore: 88 }, gates: congestedGates }

    const alerts = detectThresholdAlerts(after, before)
    expect(alerts.some((a) => a.id.startsWith('congestion-D'))).toBe(true)
  })
})

describe('recommendActions', () => {
  it('returns actions with a confidence between 0.5 and 0.97 and a positive recovery estimate', () => {
    const finalState = { metrics: { safetyRisk: 50 } }
    const actions = recommendActions('gateClosure', finalState)
    expect(actions.length).toBeGreaterThan(0)
    for (const action of actions) {
      expect(action.confidence).toBeGreaterThanOrEqual(0.5)
      expect(action.confidence).toBeLessThanOrEqual(0.97)
      expect(action.estimatedRecoveryMin).toBeGreaterThan(0)
    }
  })

  it('gives higher confidence when severity is higher, for the same scenario', () => {
    const lowSeverity = recommendActions('securityIncident', { metrics: { safetyRisk: 10 } })
    const highSeverity = recommendActions('securityIncident', { metrics: { safetyRisk: 90 } })
    expect(highSeverity[0].confidence).toBeGreaterThan(lowSeverity[0].confidence)
  })
})
