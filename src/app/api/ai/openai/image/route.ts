/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getEnvVariable } from '@/lib/env';
import { logUsage } from '@/lib/usage-logger';

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
  const startTime = Date.now();
  
  try {
    // Get API key from request
    const apiKey = req.headers.get('x-api-key');
    const validApiKey = process.env.E2_AI_API_ACCESS_KEY;

    if (!validApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: E2_AI_API_ACCESS_KEY not set' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing API key' },
        { status: 401 }
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
      // Log error
      logUsage({
        timestamp: startTime,
        provider: 'openai',
        model: `${model}-image`,
        success: false,
        error: data.error?.message || 'Unknown error'
      });
      
      return NextResponse.json(
        { error: data.error?.message || 'An error occurred with the OpenAI Image API' },
        { status: response.status }
      );
    }

    // Log successful usage
    logUsage({
      timestamp: startTime,
      provider: 'openai',
      model: `${model}-image`,
      success: true
    });
    
    // Add CORS headers to the response
    const nextResponse = NextResponse.json(data);
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return nextResponse;
  } catch (error: any) {
    console.error('OpenAI Image API error:', error);
    
    // Log error
    logUsage({
      timestamp: startTime,
      provider: 'openai',
      model: 'image-generation',
      success: false,
      error: error.message || 'Unknown error'
    });
    
    // Add CORS headers to the error response
    const errorResponse = NextResponse.json(
      { error: error.message || 'An error occurred with the OpenAI Image API' },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return errorResponse;
  }
}
