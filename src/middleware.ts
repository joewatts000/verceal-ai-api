/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply to /api/ai routes
  if (!request.nextUrl.pathname.startsWith('/api/ai')) {
    return NextResponse.next();
  }

   // Check for API key in the request
   const apiKey = request.headers.get('x-api-key');
   const validApiKey = process.env.API_ACCESS_KEY;
 
   if (!validApiKey) {
     return NextResponse.json(
       { error: 'Server configuration error: API_ACCESS_KEY not set' },
       { status: 500 }
     );
   }
 
   if (!apiKey || apiKey !== validApiKey) {
     return NextResponse.json(
       { error: 'Unauthorized: Invalid or missing API key' },
       { status: 401 }
     );
   }
  
  // Extract the provider from the URL
  const provider = request.nextUrl.pathname.split('/')[3];
  
  if (!provider) {
    return NextResponse.next();
  }
  
  try {
    // Check if the API key for the provider exists
    const keyMap: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      replicate: 'REPLICATE_API_KEY',
    };

    const envKey = keyMap[provider.toLowerCase()];
    if (!envKey) {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
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
    
    return NextResponse.next();
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
