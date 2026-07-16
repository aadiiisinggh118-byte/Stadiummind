import { describe, it, expect } from 'vitest'
import { validateArgs } from './selfHeal.js'

describe('validateArgs', () => {
  it('accepts valid args for a tool with a required enum field', () => {
    const result = validateArgs('lookup_venue_policy', { topic: 'bagPolicy' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects a missing required field', () => {
    const result = validateArgs('lookup_venue_policy', {})
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/Missing required field "topic"/)
  })

  it('rejects a value outside the allowed enum', () => {
    const result = validateArgs('lookup_venue_policy', { topic: 'ticket-prices' })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/must be one of/)
  })

  it('accepts tools with no required fields and no args', () => {
    const result = validateArgs('recommend_entrance', {})
    expect(result.valid).toBe(true)
  })

  it('rejects an unknown tool name', () => {
    const result = validateArgs('not_a_real_tool', {})
    expect(result.valid).toBe(false)
  })

  it('validates remember_fact requires both key and value with key from the enum', () => {
    expect(validateArgs('remember_fact', { key: 'seatBlock', value: 'Block A' }).valid).toBe(true)
    expect(validateArgs('remember_fact', { key: 'favoriteColor', value: 'blue' }).valid).toBe(false)
    expect(validateArgs('remember_fact', { key: 'seatBlock' }).valid).toBe(false)
  })
})
