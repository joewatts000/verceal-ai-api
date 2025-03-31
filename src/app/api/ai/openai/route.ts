/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to add CORS headers to a response
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

export async function POST(req: NextRequest) {  
  try {
    const { prompt, model, stream = false, systemPrompt, options = {} } = await req.json();

    if (!prompt) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Prompt is required' }, { status: 400 }),
        req
      );
    }

    if (!model) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Model is required' }, { status: 400 }),
        req
      );
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
      
      // Add CORS headers to the stream response
      const origin = req.headers.get('origin') || '*';
      streamResponse.headers.set('Access-Control-Allow-Origin', origin);
      streamResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return streamResponse;
    } else {
      const result = await generateText({
        model: openaiModel,
        prompt,
        system: systemPrompt,
        ...options
      });

      return addCorsHeaders(
        NextResponse.json(result),
        req
      );
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    return addCorsHeaders(
      NextResponse.json(
        { error: error.message || 'An error occurred with the OpenAI API' },
        { status: 500 }
      ),
      req
    );
  }
}
