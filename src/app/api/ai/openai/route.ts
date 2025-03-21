/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { logUsage } from '@/lib/usage-logger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { prompt, model, stream = false, systemPrompt, options = {} } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    const openaiModel = openai(model);

    if (stream) {
      const result = streamText({
        model: openaiModel,
        prompt,
        system: systemPrompt,
        ...options
      });

      // Log usage
      logUsage({
        timestamp: startTime,
        provider: 'openai',
        model,
        success: true
      });

      return result.toDataStreamResponse();
    } else {
      const result = await generateText({
        model: openaiModel,
        prompt,
        system: systemPrompt,
        ...options
      });

      // Log usage with token information
      logUsage({
        timestamp: startTime,
        provider: 'openai',
        model,
        tokensUsed: result.usage?.totalTokens,
        success: true
      });

      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Log error
    logUsage({
      timestamp: startTime,
      provider: 'openai',
      model: 'unknown', // We might not know the model if the error occurred early
      success: false,
      error: error.message
    });
    
    return NextResponse.json(
      { error: error.message || 'An error occurred with the OpenAI API' },
      { status: 500 }
    );
  }
}
