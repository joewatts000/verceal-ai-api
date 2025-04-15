import { NextRequest, NextResponse } from 'next/server';
import { getAllowance } from '@/lib/rateLimiter';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  try {
    const quotaKeyType = req.headers.get('x-quota-key-type') || '';
    const maxRequests = req.headers.get('x-max-requests');
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `${ipAddress}-${quotaKeyType}`;
    const allowance = await getAllowance(redis, key, parseInt(maxRequests || ''));

    return NextResponse.json({ ...allowance });
  } catch (error) {
    return NextResponse.json({ error: `Failed to fetch rate limit allowance. ${error}` }, { status: 500 });
  }
}
