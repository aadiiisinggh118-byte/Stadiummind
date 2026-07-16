import { describe, it, expect } from 'vitest'
import { checkServiceWait } from './operationsAgent.js'

describe('checkServiceWait', () => {
  it('returns a specific service by id', () => {
    const result = checkServiceWait('restrooms')
    expect(result.found).toBe(true)
    expect(typeof result.waitMin).toBe('number')
  })

  it('returns all services when no id is given', () => {
    const result = checkServiceWait()
    expect(Array.isArray(result.services)).toBe(true)
    expect(result.services.length).toBeGreaterThan(0)
  })

  it('reports not found for an unknown id', () => {
    const result = checkServiceWait('parking-shuttle')
    expect(result.found).toBe(false)
  })
})
