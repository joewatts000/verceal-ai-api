import { NextRequest, NextResponse } from 'next/server';
import { getEnvVariable } from '@/lib/env';
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

    const apiKey = getEnvVariable('GOOGLE_AI_API_KEY');
    
    // Prepare the request body
    const requestBody: any = {
      contents: [
        ...(systemPrompt ? [{ role: 'system', parts: [{ text: systemPrompt }] }] : []),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        ...options
      }
    };

    // Determine the API endpoint based on the model
    const apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    
    // Format: models/{model}:generateContent
    const modelEndpoint = `${apiEndpoint}/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}`;
    
    const response = await fetch(`${modelEndpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Log error
      logUsage({
        timestamp: startTime,
        provider: 'gemini',
        model,
        success: false,
        error: errorData.error?.message || 'Unknown error'
      });
      
      return NextResponse.json(
        { error: errorData.error?.message || 'An error occurred with the Gemini API' },
        { status: response.status }
      );
    }

    if (stream) {
      // Log usage
      logUsage({
        timestamp: startTime,
        provider: 'gemini',
        model,
        success: true
      });
      
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      const data = await response.json();
      
      // Extract the response text
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const finishReason = data.candidates?.[0]?.finishReason || '';
      const usage = data.usageMetadata || {};
      
      // Log usage
      logUsage({
        timestamp: startTime,
        provider: 'gemini',
        model,
        tokensUsed: usage.totalTokenCount,
        success: true
      });
      
      return NextResponse.json({
        text,
        finishReason,
        usage
      });
    }
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // Log error
    logUsage({
      timestamp: startTime,
      provider: 'gemini',
      model: 'unknown',
      success: false,
      error: error.message || 'Unknown error'
    });
    
    return NextResponse.json(
      { error: error.message || 'An error occurred with the Gemini API' },
      { status: 500 }
    );
  }
}
