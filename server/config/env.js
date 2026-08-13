const parseOrigins = (value) => value
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const PORT = Number(process.env.PORT) || 3001;
export const CLIENT_ORIGINS = parseOrigins(
  process.env.CLIENT_ORIGINS || 'http://localhost:5173',
);
export const JSON_BODY_LIMIT = '10kb';

export function isAllowedOrigin(origin) {
  return !origin || CLIENT_ORIGINS.includes(origin.replace(/\/$/, ''));
}
