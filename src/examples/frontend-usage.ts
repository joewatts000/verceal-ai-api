import { AiClient } from '../lib/ai-client';

// Create a client instance
const aiClient = new AiClient('http://localhost:3000', process.env.NEXT_PUBLIC_API_ACCESS_KEY || '');

// Example: Call OpenAI
async function callOpenAI() {
  try {
    const result = await aiClient.callOpenAi({
      prompt: 'What is the capital of France?',
      model: 'gpt-4o',
      stream: false,
    });
    console.log('OpenAI response:', result);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
  }
}

// Example: Call Anthropic with streaming
async function callAnthropicWithStreaming() {
  try {
    const response = await aiClient.callAnthropic({
      prompt: 'Explain quantum computing',
      model: 'claude-3-7-sonnet-20250219',
      stream: true,
    });
    
    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Process the streamed chunk
      const chunk = new TextDecoder().decode(value);
      console.log('Chunk:', chunk);
    }
  } catch (error) {
    console.error('Error calling Anthropic:', error);
  }
}

// Example: Call Replicate
async function callReplicate() {
  try {
    const result = await aiClient.callReplicate({
      model: 'stability-ai/sdxl',
      input: {
        prompt: 'A photo of a cat on a beach',
      },
    });
    console.log('Replicate response:', result);
  } catch (error) {
    console.error('Error calling Replicate:', error);
  }
}

// Export the functions
export { callOpenAI, callAnthropicWithStreaming, callReplicate };
