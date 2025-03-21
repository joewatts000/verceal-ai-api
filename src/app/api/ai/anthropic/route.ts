/* eslint-disable @typescript-eslint/no-explicit-any */
import { anthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
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
        ...options
      });

      return result.toDataStreamResponse({
        sendReasoning: true // Enable sending reasoning tokens for Claude models
      });
    } else {
      const result = await generateText({
        model: anthropicModel,
        prompt,
        system: systemPrompt,
        ...options
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
