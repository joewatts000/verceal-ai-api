import { providersAndModels } from './providersAndModels';

export function getModelOptions(provider: keyof typeof providersAndModels) {
  switch (provider) {
    case 'openai':
      return (
        <>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="dall-e3">Dall-E 3</option>
          <option value="gpt-image-1">GPT Image 1</option>
        </>
      );
    case 'anthropic':
      return (
        <>
          <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</option>
          <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
        </>
      );
    case 'gemini':
      return (
        <>
          <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          <option value="gemini-pro">Gemini Pro</option>
        </>
      );
    case 'stability':
      return (
        <>
          <option value="stability-image">Stability Image</option>
        </>
      );
    default:
      return <option value="">Select a model</option>;
  }
}
