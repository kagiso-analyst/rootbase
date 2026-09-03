import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'rootbase:api',
    })
  : null

function getClientKey(request: NextRequest, userId?: string) {
  if (userId) return `user:${userId}`

  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const address = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
  return `ip:${address}`
}

export async function checkApiRateLimit(request: NextRequest, userId?: string) {
  if (!apiRateLimiter) {
    return { success: true, limit: 60, remaining: 60, reset: Date.now() + 60_000 }
  }

  return apiRateLimiter.limit(getClientKey(request, userId))
}

export function rateLimitHeaders(limit: number, remaining: number, reset: number) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(reset / 1000)),
  }
}