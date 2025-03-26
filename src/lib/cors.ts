import { NextRequest, NextResponse } from 'next/server';

// Configure CORS options
const corsOptions = {
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedOrigins: ['*'], // Use specific domains in production, e.g. ['https://yourdomain.com']
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours in seconds
  credentials: true,
};

export function corsMiddleware(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '*';
  
  // Check if the origin is allowed (in this case we're allowing all origins with '*')
  // For production, you might want to check against a list of allowed origins
  const isAllowedOrigin = corsOptions.allowedOrigins.includes('*') || 
                          corsOptions.allowedOrigins.includes(origin);
  
  // Create a new response
  const response = NextResponse.next();
  
  // Set CORS headers
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    
    if (corsOptions.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    // For preflight requests
    if (request.method === 'OPTIONS') {
      response.headers.set('Access-Control-Allow-Methods', corsOptions.allowedMethods.join(', '));
      response.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
      response.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
      
      // For exposed headers
      if (corsOptions.exposedHeaders.length > 0) {
        response.headers.set('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));
      }
    }
  }
  
  return response;
}
