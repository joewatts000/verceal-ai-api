export async function callQuotaApi({
  key,
}: {
  key: string;
}) {
  const res = await fetch(`/api/ai/ratelimit`, {
    method: 'POST',
    headers: {
      'X-API-Key': key,
    },
  });

  console.log(res)

  if (!res.ok) {
    throw new Error(`Error: ${res.status}`);
  }
  const data = await res.json();
  return data;
}
