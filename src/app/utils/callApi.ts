export async function callApi({
  provider,
  model,
  prompt,
  key,
}: {
  provider: string;
  model: string;
  prompt: string;
  key: string;
}) {
  let url = `/api/ai/${provider}`;
  let body: { prompt: string; model?: string; provider?: string; stream?: boolean } = { prompt, model, provider, stream: false };

  if (provider === 'stability') {
    url = `/api/ai/stability/image`;
    body = { prompt };
  } else if (provider === 'openai' && model === 'dall-e3') {
    url = `/api/ai/openai/dalle`;
    body = { prompt };
  } else if (provider === 'openai' && model === 'gpt-image-1') {
    url = `/api/ai/openai/image`;
    body = { prompt };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': key,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to call ${provider} API`);
  }
  return data;
}
