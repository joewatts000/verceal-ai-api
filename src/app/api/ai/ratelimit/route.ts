// api/ai/ratelimit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { formatTimeUntilReset } from '@/lib/formatTimeUntilReset';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Define the services and their daily limits
const SERVICE_LIMITS = {
  'openai-text': 3,
  'openai-image': 2, 
  'anthropic-text': 3
};

// Extract just the service names for iteration
const SERVICES = Object.keys(SERVICE_LIMITS);

export async function POST(req: NextRequest) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const quotaInfo: Record<string, { remaining: number; limit: number; reset: number; resetsIn: string }> = {};
    
    // For each service, check if the key exists and how many entries it has
    for (const service of SERVICES) {
      const key = `${ipAddress}-${service}`;
      const limit = SERVICE_LIMITS[service as keyof typeof SERVICE_LIMITS];
      
      try {
        // Check if the key exists
        const exists = await redis.exists(key);
        
        if (exists) {
          const used = await redis.zcard(key);
          
          // Find the expiration time
          const ttl = await redis.ttl(key);
          const reset = ttl > 0 ? Date.now() + (ttl * 1000) : Date.now() + 24 * 60 * 60 * 1000;
          
          quotaInfo[service] = {
            remaining: Math.max(0, limit - used),
            limit,
            reset,
            resetsIn: formatTimeUntilReset(reset)
          };
        } else {
          // If key doesn't exist, user has full quota
          quotaInfo[service] = {
            remaining: limit,
            limit,
            reset: Date.now() + 24 * 60 * 60 * 1000,
            resetsIn: '24h 0m'
          };
        }
      } catch (err) {
        console.error(`Error getting rate limit for ${service}:`, err);
        // Provide default values if there's an error
        quotaInfo[service] = {
          remaining: limit,
          limit,
          reset: Date.now() + 24 * 60 * 60 * 1000,
          resetsIn: '24h 0m'
        };
      }
    }
    
    return NextResponse.json({ quotas: quotaInfo }, { status: 200 });
  } catch (error) {
    console.error('Error fetching quota information:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quota information' },
      { status: 500 }
    );
  }
}
