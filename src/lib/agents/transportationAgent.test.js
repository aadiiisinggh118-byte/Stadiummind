import { describe, it, expect } from 'vitest'
import { recommendTransportMode, computeSustainabilitySummary } from './transportationAgent.js'

describe('recommendTransportMode', () => {
  it('returns a recommendation with reason, confidence, and alternative', () => {
    const rec = recommendTransportMode()
    expect(rec.recommendation).toBeTruthy()
    expect(rec.reason.length).toBeGreaterThan(0)
    expect(rec.confidence).toBeGreaterThanOrEqual(0.5)
    expect(rec.confidence).toBeLessThanOrEqual(0.96)
    expect(rec.alternative).toBeTruthy()
  })

  it('weighs speed more heavily when kickoff is imminent', () => {
    const urgent = recommendTransportMode({ minutesToKickoff: 10 })
    expect(urgent.urgency).toBe('high')
  })

  it('weighs eco-impact more when there is plenty of time', () => {
    const relaxed = recommendTransportMode({ minutesToKickoff: 120 })
    expect(relaxed.urgency).toBe('low')
  })

  it('penalizes an inaccessible option when accessibility is required', () => {
    const options = [
      { id: 'fast-inaccessible', label: 'Fast but inaccessible', waitMin: 2, delayMin: 0, co2PerPersonKg: 5, accessible: false },
      { id: 'slower-accessible', label: 'Slower but accessible', waitMin: 10, delayMin: 0, co2PerPersonKg: 5, accessible: true },
    ]
    const rec = recommendTransportMode({ needsAccessible: true, optionsOverride: options })
    expect(rec.modeId).toBe('slower-accessible')
  })
})

describe('computeSustainabilitySummary', () => {
  it('compares the lowest-impact mode against driving alone', () => {
    const summary = computeSustainabilitySummary()
    expect(summary.co2SavedKgPerPerson).toBeGreaterThan(0)
    expect(summary.summary).toContain('kg of CO2')
  })
})