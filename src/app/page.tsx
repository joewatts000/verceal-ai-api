/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react'

const providersAndModels: { [key: string]: string[] } = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022'],
  // replicate: ['stability-ai/sdxl']
};

const getModelOptions = (provider: keyof typeof providersAndModels) => {
  switch (provider) {
    case 'openai':
      return (
        <>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
        </>
      )
    case 'anthropic':
      return (
        <>
          <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
        </>
      )
    default:
      return <option value="">Select a model</option>
  }
}

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [provider, setProvider] = useState<keyof typeof providersAndModels>('openai')
  const [model, setModel] = useState('gpt-4o')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResponse('')
    try {
      let requestBody: any = {}

      if (provider === 'replicate') {
        requestBody = {
          model: 'stability-ai/sdxl',
          input: { prompt }
        }

        const res = await fetch(`/api/ai/replicate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_ACCESS_KEY || '',
          },
          body: JSON.stringify(requestBody),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to call Replicate API')
        }

        setResponse(JSON.stringify(data, null, 2))
      } else {
        requestBody = {
          provider,
          prompt,
          model,
          stream: false
        }

        const res = await fetch(`/api/ai/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_ACCESS_KEY || '',
          },
          body: JSON.stringify(requestBody),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || `Failed to call ${provider} API`)
        }

        setResponse(data.text || JSON.stringify(data, null, 2))
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">AI Providers API Demo</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium mb-1">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value)
                const model = providersAndModels[e.target.value][0];
                setModel(model);
              }}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              {Object.keys(providersAndModels).map((providerKey) => (
                <option key={providerKey} value={providerKey}>
                  {providerKey.charAt(0).toUpperCase() + providerKey.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {provider !== 'replicate' && (
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">
                Model
              </label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              >
                {getModelOptions(provider)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-1">
              Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="Enter your prompt here..."
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate Response'}
          </button>
        </form >
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}
        {response && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Response</h2>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-96">
              <pre className="whitespace-pre-wrap text-black">{response}</pre>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
