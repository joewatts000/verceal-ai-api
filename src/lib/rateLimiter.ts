import { Redis } from '@upstash/redis';

export function parseTimeToMs(timeStr: string): number {
  const [valueStr, unit] = timeStr.split(' ');
  const value = parseInt(valueStr, 10);
  
  switch (unit.toLowerCase()) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown time unit: ${unit}`);
  }
}

export function createSlidingWindowRateLimiter(redis: Redis, maxRequests: number, windowSize: string) {
  const windowSizeMs = parseTimeToMs(windowSize);
  
  /**
   * Limit based on the provided key using a true sliding window
   */
  async function limit(key: string) {
    const now = Date.now();
    const windowStart = now - windowSizeMs;
    const resetTime = now + windowSizeMs;
    
    // Execute Redis script to update and check the rate limit
    const pipeline = redis.pipeline();
    
    // Add current timestamp to sorted set
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    
    // Remove old timestamps outside the current window
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count timestamps in the current window
    pipeline.zcard(key);
    
    // Set expiration on the key to prevent memory leaks
    pipeline.expire(key, Math.ceil(windowSizeMs / 1000));
    
    const results = await pipeline.exec();
    const requestCount = results[2] as number;
    
    const remaining = Math.max(0, maxRequests - requestCount);
    const success = requestCount <= maxRequests;
    
    return {
      success,
      remaining,
      reset: resetTime,
      limit: maxRequests
    };
  }
  
  return { limit };
}
