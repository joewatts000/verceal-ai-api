/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getEnvVariable } from '@/lib/env';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';

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
  try {
    // Parse request body
    const { prompt, size = '1024x1024', n = 1, style = 'photographic' } = await req.json();

    if (!prompt) {
      return new NextResponse(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    // Get Stability API key
    const stabilityApiKey = getEnvVariable('STABILITY_API_KEY');
    if (!stabilityApiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'Stability API key is not configured' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
    
    // Parse size into width and height
    const [width, height] = size.split('x').map(Number);
    
    // Set up timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    try {
      console.log('Calling Stability AI API for image generation...');
      
      // Call Stability AI API for image generation
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${stabilityApiKey}`
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
              weight: 1
            }
          ],
          cfg_scale: 7,
          height: height || 1024,
          width: width || 1024,
          samples: n || 1,
          steps: 30,
          style_preset: style || 'photographic'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `Stability AI API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.log(e);
          // If JSON parsing fails, try to get the text
          try {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          } catch (e2) {
          console.log(e2);
            // If that also fails, use the status text
          }
        }
        
        console.error('Stability AI API error:', errorMessage);
        
        return new NextResponse(
          JSON.stringify({ error: errorMessage }),
          { 
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
      
      const data = await response.json();
      console.log('Stability AI API response received');
      
      // Process the response to extract image data
      let images = [];
      
      if (data.artifacts && data.artifacts.length > 0) {
        images = data.artifacts.map((artifact: any) => ({
          url: `data:image/png;base64,${artifact.base64}`,
          seed: artifact.seed,
          finish_reason: artifact.finish_reason
        }));
      }
      
      if (images.length === 0) {
        throw new Error('No images were generated');
      }

      const returnData = await uploadToCloudinary({
        data: [
          {
            url: images[0].url
          }
        ]
      });
      
      return new NextResponse(
        JSON.stringify(returnData),
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return new NextResponse(
          JSON.stringify({ error: 'Request timed out. Image generation is taking too long.' }),
          { 
            status: 504,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
      
      throw fetchError; // Re-throw for the outer catch block
    }
  } catch (error: any) {
    console.error('Stability AI Image API error:', error);
    // Return error with proper headers
    return new NextResponse(
      JSON.stringify({ error: error.message || 'An error occurred with the Stability AI Image API' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}
