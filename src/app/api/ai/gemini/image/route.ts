/* eslint-disable @typescript-eslint/no-unused-vars */
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
    // Parse request body
    const { prompt, model = 'imagegeneration@005', size = '1024x1024', n = 1 } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get Google AI API key
    const googleApiKey = getEnvVariable('GOOGLE_AI_API_KEY');
    
    // Parse size into width and height
    const [width, height] = size.split('x').map(Number);
    
    // Call Gemini API for image generation
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
          responseMimeType: 'image/png',
          stopSequences: []
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ],
        tools: [
          {
            functionDeclarations: [
              {
                name: 'generateImage',
                description: 'Generate an image based on the prompt',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    prompt: {
                      type: 'STRING',
                      description: 'The prompt to generate an image for'
                    },
                    dimensions: {
                      type: 'OBJECT',
                      properties: {
                        width: {
                          type: 'INTEGER',
                          description: 'The width of the image'
                        },
                        height: {
                          type: 'INTEGER',
                          description: 'The height of the image'
                        }
                      }
                    }
                  },
                  required: ['prompt', 'dimensions']
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Log error
      logUsage({
        timestamp: startTime,
        provider: 'gemini',
        model: `${model}`,
        success: false,
        error: data.error?.message || 'Unknown error'
      });
      
      return NextResponse.json(
        { error: data.error?.message || 'An error occurred with the Gemini Image API' },
        { status: response.status }
      );
    }

    // Process the response to extract image data
    let images = [];
    
    try {
      // Extract images from the response
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        if (candidate.content && candidate.content.parts) {
          images = candidate.content.parts
            .filter((part: { inlineData: { mimeType: string; }; }) => part.inlineData && part.inlineData.mimeType.startsWith('image/'))
            .map((part: { inlineData: { mimeType: any; data: any; }; }) => ({
              url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              mimeType: part.inlineData.mimeType
            }));
        }
      }
      
      if (images.length === 0) {
        throw new Error('No images generated');
      }
    } catch (error: any) {
      console.error('Error processing Gemini image response:', error);
      
      // Log error
      logUsage({
        timestamp: startTime,
        provider: 'gemini',
        model: `${model}`,
        success: false,
        error: error.message || 'Error processing image response'
      });
      
      return NextResponse.json(
        { error: 'Failed to process image generation response' },
        { status: 500 }
      );
    }

    // Log successful usage
    logUsage({
      timestamp: startTime,
      provider: 'gemini',
      model: `${model}`,
      success: true
    });
    
    // Format the response to match OpenAI's format for consistency
    interface Image {
      url: string;
      mimeType: string;
    }

    interface FormattedResponse {
      created: number;
      data: Array<{
        url: string;
        revised_prompt: string;
      }>;
    }

    const formattedResponse: FormattedResponse = {
      created: Math.floor(Date.now() / 1000),
      data: images.map((image: Image) => ({
        url: image.url,
        revised_prompt: prompt
      }))
    };
    
    // Add CORS headers to the response
    const nextResponse = NextResponse.json(formattedResponse);
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return nextResponse;
  } catch (error: any) {
    console.error('Gemini Image API error:', error);
    
    // Log error
    logUsage({
      timestamp: startTime,
      provider: 'gemini',
      model: 'image-generation',
      success: false,
      error: error.message || 'Unknown error'
    });
    
    // Add CORS headers to the error response
    const errorResponse = NextResponse.json(
      { error: error.message || 'An error occurred with the Gemini Image API' },
      { status: 500 }
    );
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    
    return errorResponse;
  }
}
