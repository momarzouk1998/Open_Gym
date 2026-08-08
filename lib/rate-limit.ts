/**
 * Simple in-memory rate limiter — no external dependencies.
 * Works with Next.js standalone/Docker where a single Node process handles requests.
 *
 * Uses a sliding window per IP address.
 * Automatically prunes expired entries to prevent memory leaks.
 */

interface RateLimitEntry {
  count: number
  resetAt: number // Unix ms
}

const store = new Map<string, RateLimitEntry>()

// Prune entries older than their window every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  },
  5 * 60 * 1000
)

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSecs: number
}

interface RateLimitResult {
  /** true = request is allowed */
  allowed: boolean
  /** Remaining requests in this window */
  remaining: number
  /** Seconds until the window resets */
  retryAfter: number
}

/**
 * Check and record a rate-limited hit for the given key (usually IP).
 *
 * @example
 * const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
 * const result = rateLimit(`register:${ip}`, { limit: 5, windowSecs: 60 })
 * if (!result.allowed) return NextResponse.json({ error: '...' }, { status: 429 })
 */
export function rateLimit(
  key: string,
  { limit, windowSecs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSecs * 1000

  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  entry.count += 1

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  return { allowed: true, remaining: limit - entry.count, retryAfter: 0 }
}

/** Extract the real client IP from a Next.js Request */
export function getClientIp(request: Request): string {
  // Respect common proxy headers (Nginx, Cloudflare, DO load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}
