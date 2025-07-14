
interface ApiResponseDisplayProps {
  error?: string;
  response?: string;
}

export function ApiResponseDisplay({ error, response }: ApiResponseDisplayProps) {
  return (
    <>
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
    </>
  );
}
