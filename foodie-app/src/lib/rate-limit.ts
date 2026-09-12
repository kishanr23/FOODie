// ─── Rate Limiter ───
// In-memory sliding window rate limiter for API routes

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000 },        // 5 per 15 min
  'auth/signup': { maxRequests: 3, windowMs: 60 * 60 * 1000 },       // 3 per hour
  'auth/reset': { maxRequests: 3, windowMs: 60 * 60 * 1000 },        // 3 per hour
  'visits': { maxRequests: 5, windowMs: 60 * 60 * 1000 },            // 5 per hour
  'posts': { maxRequests: 10, windowMs: 60 * 60 * 1000 },            // 10 per hour
  'comments': { maxRequests: 30, windowMs: 60 * 60 * 1000 },         // 30 per hour
  'likes': { maxRequests: 60, windowMs: 60 * 60 * 1000 },            // 60 per hour
  'follows': { maxRequests: 30, windowMs: 60 * 60 * 1000 },          // 30 per hour
  'reports': { maxRequests: 10, windowMs: 60 * 60 * 1000 },          // 10 per hour
  'general': { maxRequests: 100, windowMs: 60 * 1000 },              // 100 per min
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,   // IP or userId
  endpoint: string      // key from RATE_LIMITS
): RateLimitResult {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS['general'];
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();

  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

// Helper to get client IP from request headers
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
