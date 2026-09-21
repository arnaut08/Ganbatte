import { FALLBACK_GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MODEL } from '../config/env.js';

export const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.0-flash-lite',
] as const;

type GeminiModel = typeof GEMINI_MODELS[number];
type FetchLike = typeof fetch;

const dailyExhaustion = new Map<GeminiModel, number>();
let requestSequence = 0;

export class GeminiRateLimitError extends Error {
  constructor() {
    super('Gemini rate limit exhausted');
    this.name = 'GeminiRateLimitError';
  }
}

export function resolveGeminiModel(modelName: string | undefined): string {
  const normalized = typeof modelName === 'string' ? modelName.trim() : '';
  return normalized && GEMINI_MODELS.includes(normalized as GeminiModel)
    ? normalized
    : FALLBACK_GEMINI_MODEL;
}

function nextUtcMidnight(): number {
  const date = new Date();
  date.setUTCHours(24, 0, 0, 0);
  return date.getTime();
}

function isDailyQuotaMessage(message: string): boolean {
  return /per.?day|daily|requests.*day|day.*requests/i.test(message);
}

function isTransientResponse(response: Response): boolean {
  return response.status === 429 || [408, 500, 502, 503, 504].includes(response.status);
}

async function responseDetails(response: Response): Promise<string> {
  try {
    const body = typeof response.clone === 'function' ? await response.clone().text() : '';
    return body.replace(/\s+/g, ' ').trim().slice(0, 500);
  } catch {
    return '';
  }
}

async function isDailyQuotaResponse(response: Response): Promise<boolean> {
  if (response.status !== 429) return false;
  try {
    const body = typeof response.clone === 'function' ? await response.clone().text() : '';
    return isDailyQuotaMessage(body);
  } catch {
    return false;
  }
}

function availableModels(requestedModel: string): GeminiModel[] {
  const resolvedModel = resolveGeminiModel(requestedModel) as GeminiModel;
  const now = Date.now();

  return GEMINI_MODELS.slice(GEMINI_MODELS.indexOf(resolvedModel)).filter((model) => {
    const exhaustedUntil = dailyExhaustion.get(model);
    if (exhaustedUntil && exhaustedUntil <= now) dailyExhaustion.delete(model);
    return !dailyExhaustion.has(model);
  });
}

export interface GeminiRequestOptions {
  fetchImpl?: FetchLike;
  model?: string;
  init: RequestInit;
}

export interface GeminiResponse {
  response: Response;
  model: string;
}

export async function fetchGeminiWithFallback({
  fetchImpl = fetch,
  model = GEMINI_MODEL,
  init,
}: GeminiRequestOptions): Promise<GeminiResponse> {
  const requestId = `gemini-${Date.now()}-${requestSequence += 1}`;
  if (!GEMINI_API_KEY) {
    console.error('[Gemini] request rejected: API key is not configured', { requestId });
    throw new Error('GEMINI_API_KEY is required for Gemini generation');
  }

  const models = availableModels(model);
  console.info('[Gemini] request started', {
    requestId,
    requestedModel: model,
    resolvedModel: resolveGeminiModel(model),
    candidateModels: models,
  });
  if (models.length === 0) {
    console.warn('[Gemini] request stopped: all candidate models are daily-quota exhausted', { requestId });
    throw new GeminiRateLimitError();
  }
  let lastResponse: Response | undefined;

  for (const [attemptIndex, candidate] of models.entries()) {
    const attempt = attemptIndex + 1;
    const startedAt = Date.now();
    console.info('[Gemini] attempt started', { requestId, attempt, candidate });
    let response: Response;
    try {
      response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${GEMINI_API_KEY}`,
        init,
      );
    } catch (error) {
      console.error('[Gemini] attempt failed before receiving a response', {
        requestId,
        attempt,
        candidate,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    if (response.ok) {
      console.info('[Gemini] attempt succeeded', {
        requestId,
        attempt,
        candidate,
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      return { response, model: candidate };
    }

    lastResponse = response;
    const transient = isTransientResponse(response);
    const details = await responseDetails(response);
    console.warn('[Gemini] attempt returned an error', {
      requestId,
      attempt,
      candidate,
      status: response.status,
      transient,
      durationMs: Date.now() - startedAt,
      details,
    });
    if (!transient) {
      console.warn('[Gemini] stopping fallback: response is not retryable', { requestId, candidate, status: response.status });
      break;
    }
    if (await isDailyQuotaResponse(response)) {
      dailyExhaustion.set(candidate, nextUtcMidnight());
      console.warn('[Gemini] candidate marked daily-quota exhausted', { requestId, candidate });
    }
    const nextCandidate = models[attemptIndex + 1];
    if (nextCandidate) console.info('[Gemini] falling back to next candidate', { requestId, from: candidate, to: nextCandidate });
  }

  if (lastResponse?.status === 429) {
    console.warn('[Gemini] request exhausted rate limits', { requestId });
    throw new GeminiRateLimitError();
  }
  console.error('[Gemini] request failed after all attempts', { requestId, status: lastResponse?.status ?? 429 });
  throw new Error(`Gemini API returned ${lastResponse?.status ?? 429}`);
}
