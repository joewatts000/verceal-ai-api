/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getEnvVariable } from '@/lib/env';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis and Rate Limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '60 s'), // 10 requests per 60 seconds
  analytics: true,
});

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {  
  try {
    // Extract IP address for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    // Check the rate limit
    const { success, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', remaining },
        { status: 429, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Parse request body
    const { prompt, model = 'dall-e-3', n = 1, size = '1024x1024', quality = 'standard', style = 'vivid' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get OpenAI API key
    const openaiApiKey = getEnvVariable('OPENAI_API_KEY');
    
    // Call OpenAI API for image generation
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        prompt,
        model,
        n,
        size,
        quality,
        style,
        response_format: 'url'
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
    
    // Add CORS headers to the response
    const nextResponse = NextResponse.json(returnData);
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
