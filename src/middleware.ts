/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { corsMiddleware } from './lib/cors';

export function middleware(request: NextRequest) {
  // Handle preflight OPTIONS requests immediately
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 }); // No content
    
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || '*';
    
    // Set CORS headers for preflight
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-QUOTA-KEY-TYPE, X-MAX-REQUESTS');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }
  
  // Apply CORS for all requests
  const corsResponse = corsMiddleware(request);
  
  // Only apply API key check to /api/ai routes
  if (!request.nextUrl.pathname.startsWith('/api/ai')) {
    return corsResponse;
  }

  // Check for API key in the request
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.E2_AI_API_ACCESS_KEY;


  if (!validApiKey) {
    const errorResponse = NextResponse.json(
      { error: 'Server configuration error: E2_AI_API_ACCESS_KEY not set' },
      { status: 500 }
    );
    
    // Copy CORS headers to error response
    corsResponse.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control-')) {
        errorResponse.headers.set(key, value);
      }
    });
    
    return errorResponse;
  }

  if (!apiKey || apiKey !== validApiKey) {
    const errorResponse = NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
    
    // Copy CORS headers to error response
    corsResponse.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control-')) {
        errorResponse.headers.set(key, value);
      }
    });
    
    return errorResponse;
  }

  // Extract the provider from the URL
  const provider = request.nextUrl.pathname.split('/')[3];
  
  if (!provider) {
    return corsResponse;
  }

  try {
    // Check if the API key for the provider exists
    const keyMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      replicate: 'REPLICATE_API_KEY',
      gemini: 'GOOGLE_AI_API_KEY',
      stability: 'STABILITY_API_KEY',
      rateLimitCheck: 'OPENAI_API_KEY' // hack, just needed to pass middleware
    };

    const envKey = keyMap[provider.toLowerCase()];
    if (!envKey) {
      const errorResponse = NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
      
      // Copy CORS headers to error response
      corsResponse.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith('access-control-')) {
          errorResponse.headers.set(key, value);
        }
      });
      
      return errorResponse;
    }

    const providerApiKey = process.env[envKey];
    if (!providerApiKey) {
      const errorResponse = NextResponse.json(
        { error: `API key for ${provider} is not configured` },
        { status: 500 }
      );
      
      // Copy CORS headers to error response
      corsResponse.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith('access-control-')) {
          errorResponse.headers.set(key, value);
        }
      });
      
      return errorResponse;
    }
    
    return corsResponse;
  } catch (error: any) {
    const errorResponse = NextResponse.json(
      { error: error.message || 'Middleware error' },
      { status: 500 }
    );
    
    // Copy CORS headers to error response
    corsResponse.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('access-control-')) {
        errorResponse.headers.set(key, value);
      }
    });
    
    return errorResponse;
  }
}

export const config = {
  matcher: ['/api/ai/:path*'],
};
