import { describe, it, expect } from 'vitest'
import { capString, isOneOf, clampNumber } from './sanitize.js'

describe('capString', () => {
  it('truncates a string longer than the max length', () => {
    expect(capString('a'.repeat(100), 10)).toHaveLength(10)
  })
  it('returns the fallback for non-string input', () => {
    expect(capString(12345, 10, 'default')).toBe('default')
    expect(capString(null, 10, 'default')).toBe('default')
  })
  it('leaves a short string untouched', () => {
    expect(capString('hi', 10)).toBe('hi')
  })
})

describe('isOneOf', () => {
  it('accepts a value present in the allowed list', () => {
    expect(isOneOf('Medical', ['Medical', 'Security'])).toBe(true)
  })
  it('rejects a value not in the allowed list', () => {
    expect(isOneOf('Anything', ['Medical', 'Security'])).toBe(false)
  })
  it('rejects non-string input even if it coincidentally matches', () => {
    expect(isOneOf(123, [123])).toBe(false)
  })
})

describe('clampNumber', () => {
  it('clamps a value above the max', () => {
    expect(clampNumber(999, 0, 100, 0)).toBe(100)
  })
  it('clamps a value below the min', () => {
    expect(clampNumber(-50, 0, 100, 0)).toBe(0)
  })
  it('returns the fallback for non-numeric input', () => {
    expect(clampNumber('not a number', 0, 100, -1)).toBe(-1)
  })
})
