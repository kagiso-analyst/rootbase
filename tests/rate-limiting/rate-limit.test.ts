import { describe, expect, it } from 'vitest'
import { rateLimitHeaders } from '../../lib/rate-limit'

describe('Rate-limit headers', () => {
  it('formats limit values for HTTP response headers', () => {
    expect(rateLimitHeaders(60, 42, 1_735_000_000_000)).toEqual({
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': '42',
      'X-RateLimit-Reset': '1735000000',
    })
  })
})
