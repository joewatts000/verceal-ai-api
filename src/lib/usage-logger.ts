// Simple in-memory usage logger
// For production, use a database or analytics service

interface UsageEntry {
  timestamp: number;
  provider: string;
  model: string;
  tokensUsed?: number;
  success: boolean;
  error?: string;
}

const usageLog: UsageEntry[] = [];

export function logUsage(entry: UsageEntry): void {
  usageLog.push(entry);
  
  // In a real implementation, you would save this to a database
  console.log(`[USAGE] ${new Date(entry.timestamp).toISOString()} - ${entry.provider}/${entry.model} - ${entry.success ? 'SUCCESS' : 'ERROR'}`);
  
  // Limit in-memory log size
  if (usageLog.length > 1000) {
    usageLog.shift();
  }
}

export function getUsageStats(): {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  providerBreakdown: Record<string, number>;
} {
  const totalRequests = usageLog.length;
  const successfulRequests = usageLog.filter(entry => entry.success).length;
  const failedRequests = totalRequests - successfulRequests;
  
  const providerBreakdown: Record<string, number> = {};
  usageLog.forEach(entry => {
    const provider = entry.provider;
    providerBreakdown[provider] = (providerBreakdown[provider] || 0) + 1;
  });
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    providerBreakdown
  };
}
