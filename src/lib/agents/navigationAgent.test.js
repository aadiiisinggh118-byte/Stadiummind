import { describe, it, expect } from 'vitest'
import { recommendEntrance } from './navigationAgent.js'

describe('recommendEntrance', () => {
  it('returns a recommendation with a reason, confidence, and alternative', () => {
    const rec = recommendEntrance()
    expect(rec.recommendation).toBeTruthy()
    expect(rec.reason.length).toBeGreaterThan(0)
    expect(rec.confidence).toBeGreaterThanOrEqual(0.5)
    expect(rec.confidence).toBeLessThanOrEqual(1)
    expect(rec.alternative).toBeTruthy()
  })

  it('penalizes gates without step-free access when needsAccessible is true', () => {
    const rec = recommendEntrance({ needsAccessible: true })
    // Gate C has no ramp in mock data, so it should not be the top pick
    // when accessibility is required, even though it's physically closest.
    expect(rec.gateId).not.toBe('C')
  })
})
