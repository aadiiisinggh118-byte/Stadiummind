import { describe, it, expect } from 'vitest'
import { assessCrowdRisk } from './crowdAgent.js'

describe('assessCrowdRisk', () => {
  it('flags reroute when the current gate is congested', () => {
    // Gate C is congested (0.88 density) in mock data.
    const risk = assessCrowdRisk('C')
    expect(risk.shouldReroute).toBe(true)
    expect(risk.suggestedGate).toBeTruthy()
  })

  it('does not flag reroute for a clear, non-rising gate', () => {
    // Gate A is clear and steady in mock data.
    const risk = assessCrowdRisk('A')
    expect(risk.shouldReroute).toBe(false)
  })
})
