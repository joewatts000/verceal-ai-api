import { NextRequest, NextResponse } from 'next/server';
import { getEnvVariable } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    const { model, input, version } = await req.json();

    if (!model) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 });
    }

    if (!input) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const apiKey = getEnvVariable('REPLICATE_API_KEY');
    
    // Format: username/model:version
    const modelString = version ? `${model}:${version}` : model;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelString,
        input,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'An error occurred with the Replicate API' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Replicate API error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred with the Replicate API' },
      { status: 500 }
    );
  }
}
