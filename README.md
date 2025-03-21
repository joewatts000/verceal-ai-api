# AI Providers API

This is a unified backend API for calling various AI providers like OpenAI, Anthropic, Replicate, and more. It allows you to call these services from any frontend application without exposing your API keys.

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
REPLICATE_API_KEY=your_replicate_api_key


## Security

This API is secured with the following measures:

1. **API Key Authentication**: All requests to the API must include a valid API key in the `X-API-Key` header.
2. **Rate Limiting**: Requests are rate-limited to prevent abuse.
3. **Usage Logging**: All API usage is logged for monitoring and debugging purposes.

### Setting Up API Keys

1. Generate a strong random string to use as your API access key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
