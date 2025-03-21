export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  return value;
}

export function getProviderApiKey(provider: string): string {
  const keyMap: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    replicate: 'REPLICATE_API_KEY',
  };

  const envKey = keyMap[provider.toLowerCase()];
  if (!envKey) {
    throw new Error(`Unknown provider: ${provider}`);
  }


  return getEnvVariable(envKey);
}
