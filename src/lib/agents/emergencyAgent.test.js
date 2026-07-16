import { describe, it, expect } from 'vitest'
import { classifyIncident } from './emergencyAgent.js'

describe('classifyIncident', () => {
  it('classifies Medical as critical urgency with the fastest ETA', () => {
    const incident = classifyIncident('Medical')
    expect(incident.urgency).toBe('critical')
    expect(incident.etaMin).toBeLessThanOrEqual(2)
  })

  it('classifies Lost item as low urgency', () => {
    const incident = classifyIncident('Lost item')
    expect(incident.urgency).toBe('low')
  })

  it('produces distinct volunteer and user instructions', () => {
    const incident = classifyIncident('Accessibility assistance')
    expect(incident.volunteerInstructions).not.toBe(incident.userInstructions)
  })
})
