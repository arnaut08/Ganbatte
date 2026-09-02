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
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required for Gemini generation');

  const models = availableModels(model);
  let lastResponse: Response | undefined;

  for (const candidate of models) {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${GEMINI_API_KEY}`,
      init,
    );
    if (response.ok) return { response, model: candidate };

    lastResponse = response;
    if (response.status !== 429) break;
    if (await isDailyQuotaResponse(response)) dailyExhaustion.set(candidate, nextUtcMidnight());
  }

  if (lastResponse?.status === 429) throw new GeminiRateLimitError();
  throw new Error(`Gemini API returned ${lastResponse?.status ?? 429}`);
}
