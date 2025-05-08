/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getEnvVariable } from '@/lib/env';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { Redis } from '@upstash/redis';
import { formatTimeUntilReset } from '@/lib/formatTimeUntilReset';
import { createSlidingWindowRateLimiter } from '@/lib/rateLimiter';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {  
  try {
    const rateLimiter = createSlidingWindowRateLimiter(redis, 10, '24 h');
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `${ipAddress}-openai-image`;
    const { success, reset, remaining } = await rateLimiter.limit(key);
    const waitTimeStr = formatTimeUntilReset(reset);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', resetsIn: waitTimeStr, reset, remaining },
        { status: 429, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { prompt, model = 'dall-e-3', n = 1, size = '1024x1024', quality = 'standard', style = 'vivid' } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    const openaiApiKey = getEnvVariable('OPENAI_API_KEY');
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: 'gpt-image-1',
        n,
        size,
        quality: 'high',
        // output_compression: '',
        // style,
        // response_format: 'url'
        output_format: 'jpeg',
      })
    });

    const data = await response.json();

    if (!response.ok) {      
      return NextResponse.json(
        { error: data.error?.message || 'An error occurred with the OpenAI Image API' },
        { status: response.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const returnData = await uploadToCloudinary(data);
    const nextResponse = NextResponse.json({ ...returnData, remaining, reset, resetsIn: waitTimeStr });
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    return nextResponse;
  } catch (error: any) {
    console.error('OpenAI Image API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred with the OpenAI Image API' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
