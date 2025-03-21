// Simple in-memory rate limiter
// For production, consider using Redis or another persistent store

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { limited: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateLimits.get(identifier);

  if (!entry || entry.resetTime < now) {
    // First request or window expired, create new entry
    rateLimits.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { limited: false, remaining: maxRequests - 1, reset: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return { limited: true, remaining: 0, reset: entry.resetTime };
  }

  // Increment count
  entry.count += 1;
  rateLimits.set(identifier, entry);
  return { limited: false, remaining: maxRequests - entry.count, reset: entry.resetTime };
}
