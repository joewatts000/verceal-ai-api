'use client'
import { useState } from 'react'
import { getUsageStats } from '@/lib/usage-logger'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  const fetchStats = async () => {
    try {
      // In a real implementation, this would be an API call
      const data = getUsageStats()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, validate against the stored API key
    if (apiKey === process.env.NEXT_PUBLIC_ADMIN_KEY) {
      setAuthenticated(true)
      fetchStats()
    } else {
      setError('Invalid API key')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          {error && <div className="mb-4 text-red-500">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Admin API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Usage Dashboard</h1>

        {loading ? (
          <p>Loading stats...</p>
        ) : error ? (
          <div className="bg-red-100 p-4 rounded text-red-700 mb-4">{error}</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-600">Total Requests</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-sm text-green-600">Successful</p>
                  <p className="text-2xl font-bold">{stats.successfulRequests}</p>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <p className="text-sm text-red-600">Failed</p>
                  <p className="text-2xl font-bold">{stats.failedRequests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Provider Breakdown</h2>
              <div className="space-y-2">
                {Object.entries(stats.providerBreakdown).map(([provider, count]) => (
                  <div key={provider} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{provider}</span>
                    <span className="bg-gray-200 px-2 py-1 rounded text-sm">{count} requests</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
