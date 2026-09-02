import test from 'node:test';
import assert from 'node:assert/strict';

process.env.GEMINI_API_KEY = 'test-key';

const { fetchGeminiWithFallback } = await import('./gemini-api-service.js');

function requestInit(): RequestInit {
  return { method: 'POST', body: '{}' };
}

test('falls back to the next model after a rate limit response', async () => {
  const requestedModels: string[] = [];
  const fetchImpl = async (url: string | URL | Request) => {
    url = url.toString();
    requestedModels.push(url.match(/models\/([^:]+)/)?.[1] || '');
    if (requestedModels.length === 1) {
      return new Response(JSON.stringify({ error: { message: 'quota exceeded per minute' } }), { status: 429 });
    }
    return new Response('{}', { status: 200 });
  };

  const result = await fetchGeminiWithFallback({
    fetchImpl,
    model: 'gemini-3.8-flash',
    init: requestInit(),
  });

  assert.deepEqual(requestedModels, ['gemini-3.8-flash', 'gemini-3.7-flash']);
  assert.equal(result.model, 'gemini-3.7-flash');
});

test('skips models marked as daily-quota exhausted', async () => {
  const requestedModels: string[] = [];
  const fetchImpl = async (url: string | URL | Request) => {
    url = url.toString();
    const model = url.match(/models\/([^:]+)/)?.[1] || '';
    requestedModels.push(model);
    if (model === 'gemini-3.8-flash') {
      return new Response(JSON.stringify({ error: { message: 'GenerateRequestsPerDayPerProjectPerModel quota exceeded' } }), { status: 429 });
    }
    return new Response('{}', { status: 200 });
  };

  await fetchGeminiWithFallback({ model: 'gemini-3.8-flash', fetchImpl, init: requestInit() });
  requestedModels.length = 0;
  await fetchGeminiWithFallback({ model: 'gemini-3.8-flash', fetchImpl, init: requestInit() });

  assert.deepEqual(requestedModels, ['gemini-3.7-flash']);
});

test('falls back from the last Flash model to Flash Lite', async () => {
  const requestedModels: string[] = [];
  const fetchImpl = async (url: string | URL | Request) => {
    const model = url.toString().match(/models\/([^:]+)/)?.[1] || '';
    requestedModels.push(model);
    if (model === 'gemini-2.0-flash') {
      return new Response(JSON.stringify({ error: { message: 'daily quota exceeded' } }), { status: 429 });
    }
    return new Response('{}', { status: 200 });
  };

  const result = await fetchGeminiWithFallback({
    fetchImpl,
    model: 'gemini-2.0-flash',
    init: requestInit(),
  });

  assert.deepEqual(requestedModels, ['gemini-2.0-flash', 'gemini-3.5-flash-lite']);
  assert.equal(result.model, 'gemini-3.5-flash-lite');
});
