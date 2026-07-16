import { describe, it, expect } from 'vitest'
import { getStage, planLostChildSearch } from './lostChildAgent.js'

describe('getStage', () => {
  it('is immediate under 2 minutes', () => {
    expect(getStage(0)).toBe('immediate')
    expect(getStage(119)).toBe('immediate')
  })
  it('is expanding between 2 and 5 minutes', () => {
    expect(getStage(120)).toBe('expanding')
    expect(getStage(299)).toBe('expanding')
  })
  it('is escalated at 5 minutes and beyond', () => {
    expect(getStage(300)).toBe('escalated')
  })
})

describe('planLostChildSearch', () => {
  it('searches only the last-seen gate in the immediate stage', () => {
    const plan = planLostChildSearch({ lastSeenGateId: 'A', elapsedSeconds: 10 })
    expect(plan.stage).toBe('immediate')
    expect(plan.priorityGates).toHaveLength(1)
    expect(plan.priorityGates[0].id).toBe('A')
  })

  it('includes adjacent gates in the expanding stage', () => {
    const plan = planLostChildSearch({ lastSeenGateId: 'A', elapsedSeconds: 150 })
    expect(plan.stage).toBe('expanding')
    const ids = plan.priorityGates.map((g) => g.id)
    expect(ids).toContain('A')
    expect(ids).toContain('B') // adjacent to A
    expect(ids).toContain('D') // adjacent to A
  })

  it('searches all gates, densest first, once escalated', () => {
    const plan = planLostChildSearch({ lastSeenGateId: 'A', elapsedSeconds: 400 })
    expect(plan.stage).toBe('escalated')
    expect(plan.priorityGates).toHaveLength(4)
    const densities = plan.priorityGates.map((g) => g.density)
    expect(densities).toEqual([...densities].sort((a, b) => b - a))
  })

  it('always reports critical urgency', () => {
    const plan = planLostChildSearch({ lastSeenGateId: 'A', elapsedSeconds: 5 })
    expect(plan.urgency).toBe('critical')
  })
})
