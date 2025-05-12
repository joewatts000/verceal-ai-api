/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getEnvVariable } from '@/lib/env';
import { Redis } from '@upstash/redis';
import { formatTimeUntilReset } from '@/lib/formatTimeUntilReset';
import { createSlidingWindowRateLimiter } from '@/lib/rateLimiter';
import { uploadBase64ToCloudinary } from '@/lib/cloudinary-upload';

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

     
    const { prompt, size = '1024x1024' } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required', resetsIn: waitTimeStr, reset, remaining }, { status: 400 });
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
        n: 1,
        size,
        output_format: 'jpeg'
      })
    });

    const data = await response.json();

    if (!response.ok) {      
      return NextResponse.json(
        { error: data.error?.message || 'e1: An error occurred with the OpenAI Image API', resetsIn: waitTimeStr, reset, remaining },
        { status: response.status, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const imgBase64 = data.data[0].b64_json;

    const returnData = await uploadBase64ToCloudinary(imgBase64);

    if (!returnData || !returnData.data || returnData.data.length === 0) {
      return NextResponse.json(
        { error: 'e3: An error occurred with the Cloudinary upload', resetsIn: waitTimeStr, reset, remaining },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const nextResponse = NextResponse.json({ ...returnData, remaining, reset, resetsIn: waitTimeStr });
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    return nextResponse;
    
  } catch (error: any) {
    // console.error('OpenAI Image API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'e2: An error occurred with the OpenAI Image API' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
