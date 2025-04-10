/* eslint-disable @typescript-eslint/no-explicit-any */
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { formatTimeUntilReset } from '@/lib/formatTimeUntilReset';
import { createSlidingWindowRateLimiter } from '@/lib/rateLimiter';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const rateLimiter = createSlidingWindowRateLimiter(redis, 20, '24 h');
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = `${ipAddress}-anthropic-text`;
    const { success, reset, remaining } = await rateLimiter.limit(key);
    const waitTimeStr = formatTimeUntilReset(reset);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset, resetsIn: waitTimeStr, remaining },
        { status: 429 }
      );
    }

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
        sendReasoning: true,
      });
    } else {
      const result = await generateText({
        model: anthropicModel,
        prompt,
        system: systemPrompt,
        ...options,
      });

      return NextResponse.json({ ...result, remaining, reset, resetsIn: waitTimeStr });
    }
  } catch (error: any) {
    console.error('Anthropic API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred with the Anthropic API', },
      { status: 500 }
    );
  }
}
