/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';

export function middleware(request: NextRequest) {
  // Only apply to /api/ai routes
  if (!request.nextUrl.pathname.startsWith('/api/ai')) {
    return NextResponse.next();
  }

  // Check for API key in the request
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.NEXT_PUBLIC_API_ACCESS_KEY;

  if (!validApiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: NEXT_PUBLIC_API_ACCESS_KEY not set' },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  // Apply rate limiting
  const ip = request.ip || 'unknown';
  const identifier = `${apiKey}:${ip}`;
  const { limited, remaining, reset } = rateLimit(identifier);

  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    );
  }

  // Add rate limit headers to the response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());

  // Extract the provider from the URL
  const provider = request.nextUrl.pathname.split('/')[3];
  
  if (!provider) {
    return response;
  }

  try {
    // Check if the API key for the provider exists
    const keyMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      gemini: 'GOOGLE_AI_API_KEY'
    };

    const envKey = keyMap[provider.toLowerCase()];
    if (!envKey) {
      return NextResponse.json(
        { error: `Middleware Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    const providerApiKey = process.env[envKey];
    if (!providerApiKey) {
      return NextResponse.json(
        { error: `API key for ${provider} is not configured` },
        { status: 500 }
      );
    }
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Middleware error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: '/api/ai/:path*',
};
