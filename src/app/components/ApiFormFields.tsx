import { FormLabel } from './FormLabel';
import { FormSelect } from './FormSelect';
import { FormTextarea } from './FormTextarea';

type ApiFormFieldsProps = {
  provider: string;
  setProvider: (provider: string) => void;
  model: string;
  setModel: (model: string) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  providersAndModels: Record<string, string[]>;
  getModelOptions: (provider: string) => React.ReactNode;
};

export function ApiFormFields({
  provider,
  setProvider,
  model,
  setModel,
  prompt,
  setPrompt,
  providersAndModels,
  getModelOptions,
}: ApiFormFieldsProps) {
  return (
    <>
      <div>
        <FormLabel htmlFor="provider">Provider</FormLabel>
        <FormSelect
          id="provider"
          value={provider}
          onChange={(e) => {
            setProvider(e.target.value);
            const model = providersAndModels[e.target.value][0];
            setModel(model);
          }}
        >
          {Object.keys(providersAndModels).map((providerKey) => (
            <option key={providerKey} value={providerKey}>
              {providerKey.charAt(0).toUpperCase() + providerKey.slice(1)}
            </option>
          ))}
        </FormSelect>
      </div>
      {provider !== 'replicate' && (
        <div>
          <FormLabel htmlFor="model">Model</FormLabel>
          <FormSelect
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {getModelOptions(provider)}
          </FormSelect>
        </div>
      )}
      <div>
        <FormLabel htmlFor="prompt">Prompt</FormLabel>
        <FormTextarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Enter your prompt here..."
        />
      </div>
    </>
  );
}
