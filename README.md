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
