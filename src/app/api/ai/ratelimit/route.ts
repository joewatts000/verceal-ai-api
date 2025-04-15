// api/ai/quota/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: process.env.REDIS_TOKEN || '',
});

// Define the quota limits for each service
const QUOTA_LIMITS = {
  'openai-text': 10,
  'openai-image': 10,
  'anthropic-text': 10,
};

// Define the services to check
const SERVICES = ['openai-text', 'openai-image', 'anthropic-text'];

export async function GET(req: NextRequest) {
  try {
    // Get the IP address from the request
    const ip = req.headers.get('x-forwarded-for') ||
              req.headers.get('x-real-ip') ||
              'unknown';
    
    const quotas: Record<string, { remaining: number; limit: number; reset: string }> = {};
    
    // Get tomorrow's date at midnight UTC (when quota resets)
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const resetTime = tomorrow.toISOString();
    
    // Get the remaining quota for each service
    const pipeline = redis.pipeline();
    
    SERVICES.forEach(service => {
      const key = `${ip}-${service}`;
      pipeline.get(key);
    });
    
    const results = await pipeline.exec();
    
    // Process results
    SERVICES.forEach((service, index) => {
      const usedCount = results[index] ? parseInt(results[index] as string, 10) : 0;
      const limit = QUOTA_LIMITS[service as keyof typeof QUOTA_LIMITS];
      
      quotas[service] = {
        remaining: Math.max(0, limit - usedCount),
        limit,
        reset: resetTime,
      };
    });
    
    return NextResponse.json({ quotas }, { status: 200 });
  } catch (error) {
    console.error('Error fetching quota information:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quota information' },
      { status: 500 }
    );
  }
}
