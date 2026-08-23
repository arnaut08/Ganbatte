import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

export async function attachAuthContext(req, res, next) {
  if (!isSupabaseConfigured()) {
    req.user = null;
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const { data, error } = await getSupabaseClient().auth.getUser(token);

    if (error && /jwt issued at future/i.test(error.message || '')) {
      console.warn('Rejected auth token with future-issued JWT:', error.message);
      req.user = null;
      return next();
    }

    req.user = error || !data?.user ? null : data.user;
    return next();
  } catch (error) {
    console.error('Auth lookup failed for request:', error);
    req.user = null;
    return next();
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  return next();
}
