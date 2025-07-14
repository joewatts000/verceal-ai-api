/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useState } from 'react';
import { ApiFormFields } from './components/ApiFormFields';
import { ApiResponseDisplay } from './components/ApiResponseDisplay';
import { providersAndModels } from './utils/providersAndModels';
import { getModelOptions } from './utils/getModelOptions';
import { callApi } from './utils/callApi';
import { FormButton } from './components/FormButton';
import { Main, Container, PageTitle, FormSection } from './components/PageLayout';
import { callQuotaApi } from './utils/callQuotaApi';
import { YSpacer } from './components/YSpacer';

const key = process.env.NEXT_PUBLIC_E2_AI_API_ACCESS_KEY || '';

export default function LocalContent() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<string>('openai');
  const [model, setModel] = useState('gpt-4o');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetStates = useCallback(() => {
    setLoading(true);
    setError('');
    setResponse('');
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    resetStates();
    try {
      const data = await callApi({ provider, model, prompt, key });
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [model, prompt, provider, resetStates]);

  const checkQuota = useCallback(async () => {
    resetStates();
    try {
      const data = await callQuotaApi({ key });
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [resetStates]);

  return (
    <Main>
      <Container>
        <PageTitle>AI Providers API Demo</PageTitle>
        <FormSection onSubmit={handleSubmit}>
          <ApiFormFields
            provider={provider}
            setProvider={setProvider}
            model={model}
            setModel={setModel}
            prompt={prompt}
            setPrompt={setPrompt}
            providersAndModels={providersAndModels}
            getModelOptions={getModelOptions}
          />
          <FormButton
            type="submit"
            disabled={loading || !prompt}
          >
            {loading ? 'Loading...' : 'Test API Route'}
          </FormButton>
        </FormSection>
        <YSpacer />
        <hr />
        <YSpacer />
        <FormButton onClick={checkQuota}>
          Check quota
        </FormButton>
        <YSpacer />
        <hr />
        <YSpacer />
        <ApiResponseDisplay error={error} response={response} />
      </Container>
    </Main>
  );
}
