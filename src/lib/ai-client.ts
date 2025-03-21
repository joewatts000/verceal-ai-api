type AiRequestOptions = {
  prompt: string;
  model: string;
  stream?: boolean;
  systemPrompt?: string;
  options?: Record<string, any>;
};

type ReplicateRequestOptions = {
  model: string;
  input: Record<string, any>;
  version?: string;
};

export class AiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async callOpenAi(options: AiRequestOptions) {
    return this.callProvider('openai', options);
  }

  async callAnthropic(options: AiRequestOptions) {
    return this.callProvider('anthropic', options);
  }

  async callOpenRouter(options: AiRequestOptions) {
    return this.callProvider('openrouter', options);
  }

  async callReplicate(options: ReplicateRequestOptions) {
    const response = await fetch(`${this.baseUrl}/api/ai/replicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to call Replicate API');
    }

    return response.json();
  }

  private async callProvider(provider: string, options: AiRequestOptions) {
    if (options.stream) {
      const response = await fetch(`${this.baseUrl}/api/ai/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to call ${provider} API`);
      }

      return response;
    } else {
      const response = await fetch(`${this.baseUrl}/api/ai/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to call ${provider} API`);
      }

      return response.json();
    }
  }
}
