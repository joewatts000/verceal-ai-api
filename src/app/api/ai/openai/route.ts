import { openai } from '@ai-sdk/openai';
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

    const openaiModel = openai(model);

    if (stream) {
      const result = streamText({
        model: openaiModel,
        prompt,
        system: systemPrompt,
        ...options
      });

      return result.toDataStreamResponse();
    } else {
      const result = await generateText({
        model: openaiModel,
        prompt,
        system: systemPrompt,
        ...options
      });

      return NextResponse.json(result);
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred with the OpenAI API' },
      { status: 500 }
    );
  }
}
