import { describe, it, expect } from 'vitest'
import { checkRateLimit } from './rateLimit.js'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const ip = 'test-ip-under-limit'
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip).allowed).toBe(true)
    }
  })

  it('blocks a client after exceeding the limit within the window', () => {
    const ip = 'test-ip-over-limit'
    let lastResult
    for (let i = 0; i < 25; i++) {
      lastResult = checkRateLimit(ip)
    }
    expect(lastResult.allowed).toBe(false)
    expect(lastResult.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tracks separate clients independently', () => {
    const ipA = 'test-ip-a'
    const ipB = 'test-ip-b'
    for (let i = 0; i < 20; i++) checkRateLimit(ipA)
    // ipA is now at/over the limit, but ipB should be unaffected
    expect(checkRateLimit(ipB).allowed).toBe(true)
  })
})
