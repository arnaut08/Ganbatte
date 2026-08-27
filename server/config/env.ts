import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url) });

/** @param {string} value */
const parseOrigins = (value: string): string[] => value
  .split(',')
  .map((origin: string) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const PORT = Number(process.env.PORT) || 3001;
export const CLIENT_ORIGINS = parseOrigins(
  process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:5174',
);
export const JSON_BODY_LIMIT = '10kb';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const REDIS_URL = process.env.REDIS_URL || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

export const FALLBACK_GEMINI_MODEL = 'gemini-3.5-flash';

/** @param {string | undefined} origin */
export function isAllowedOrigin(origin: string | undefined): boolean {
  return !origin || CLIENT_ORIGINS.includes(origin.replace(/\/$/, ''));
}
