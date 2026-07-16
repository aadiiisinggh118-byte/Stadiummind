import { describe, it, expect } from 'vitest'
import { gates, densityLevel, recommendGate } from './mockData.js'

describe('densityLevel', () => {
  it('classifies low density as Clear', () => {
    expect(densityLevel(0.1).label).toBe('Clear')
  })
  it('classifies mid density as Moderate', () => {
    expect(densityLevel(0.5).label).toBe('Moderate')
  })
  it('classifies high density as Congested', () => {
    expect(densityLevel(0.9).label).toBe('Congested')
  })
})

describe('recommendGate', () => {
  it('recommends the gate with the lowest density', () => {
    const rec = recommendGate()
    const lowestDensity = Math.min(...gates.map((g) => g.density))
    expect(rec.density).toBe(lowestDensity)
  })
})
