/* eslint-disable @typescript-eslint/no-explicit-any */
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { formatTimeUntilReset } from '@/lib/formatTimeUntilReset';

// Initialize Upstash Redis and Rate Limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '24 h'),
  analytics: true,
});

export async function POST(req: NextRequest) {
  try {
    // Extract IP address for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    // Check the rate limit
     
    const { success, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      // Calculate time until reset in milliseconds
      const now = Date.now();
      const timeUntilReset = reset - now;
      // Format the wait time in a human-readable format
      const waitTimeStr = formatTimeUntilReset(timeUntilReset);
      console.log(waitTimeStr);
      return NextResponse.json(
        { error: 'Too many requests', remaining, reset: waitTimeStr },
        { status: 429 }
      );
    }

    // Parse the request body
    const { prompt, model, stream = false, systemPrompt, options = {} } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    const anthropicModel = anthropic(model);

    if (stream) {
      const result = streamText({
        model: anthropicModel,
        prompt,
        system: systemPrompt,
        ...options,
      });

      return result.toDataStreamResponse({
        sendReasoning: true, // Enable sending reasoning tokens for Claude models
      });
    } else {
      const result = await generateText({
        model: anthropicModel,
        prompt,
        system: systemPrompt,
        ...options,
      });

      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('Anthropic API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred with the Anthropic API' },
      { status: 500 }
    );
  }
}
