/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { formatTimeUntilReset } from '@/lib/formatTimeUntilReset';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '24 h'),
  analytics: true,
});

// function addCorsHeaders(response: NextResponse, request: NextRequest) {
//   const origin = request.headers.get('origin') || '*';
//   response.headers.set('Access-Control-Allow-Origin', origin);
//   response.headers.set('Access-Control-Allow-Credentials', 'true');
//   return response;
// }

// export async function OPTIONS(request: NextRequest) {
//   const response = new NextResponse(null, { status: 204 });
//   response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
//   response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
//   response.headers.set('Access-Control-Max-Age', '86400');
//   response.headers.set('Access-Control-Allow-Credentials', 'true');
//   return response;
// }

export async function POST(req: NextRequest) {  
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { success, reset } = await ratelimit.limit(ip);

    if (!success) {
      const now = Date.now();
      const timeUntilReset = reset - now;
      const waitTimeStr = formatTimeUntilReset(timeUntilReset);
      return NextResponse.json(
        { error: 'Too many requests', resetsIn: waitTimeStr },
        { status: 429 }
      );
      // return addCorsHeaders(
      //   NextResponse.json(
      //     { error: 'Too many requests', resetsIn: waitTimeStr },
      //     { status: 429 }
      //   ),
      //   req
      // );
    }

    const { prompt, model, stream = false, systemPrompt, options = {} } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      // return addCorsHeaders(
      //   NextResponse.json({ error: 'Prompt is required' }, { status: 400 }),
      //   req
      // );
    }

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
      // return addCorsHeaders(
      //   NextResponse.json({ error: 'Model is required' }, { status: 400 }),
      //   req
      // );
    }

    const openaiModel = openai(model);

    if (stream) {
      const result = streamText({
        model: openaiModel,
        prompt,
        system: systemPrompt,
        ...options
      });

      const streamResponse = result.toDataStreamResponse();
      // const origin = req.headers.get('origin') || '*';
      // streamResponse.headers.set('Access-Control-Allow-Origin', origin);
      // streamResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return streamResponse;
    } else {
      const result = await generateText({
        model: openaiModel,
        prompt,
        system: systemPrompt,
        ...options
      });
      NextResponse.json(result)
      // return addCorsHeaders(
      //   NextResponse.json(result),
      //   req
      // );
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    NextResponse.json(
      { error: error.message || 'An error occurred with the OpenAI API' },
      { status: 500 }
    );
    // return addCorsHeaders(
    //   NextResponse.json(
    //     { error: error.message || 'An error occurred with the OpenAI API' },
    //     { status: 500 }
    //   ),
    //   req
    // );
  }
}
