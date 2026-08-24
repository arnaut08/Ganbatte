import { SERVER_URL } from '../config';
import { supabase } from '../config/supabase';

const PROTECTED_PATH_PREFIXES = ['/api/friends', '/api/friend-requests', '/api/users/search', '/api/assessments', '/api/grammar-lessons', '/api/kana-cards', '/api/kanji-cards', '/api/kanji-attempts', '/api/rooms', '/api/generate-cards'];
const pendingRequests = new Map();

function isFutureJwtError(error) {
  const message = String(error?.message || error || '');
  return /jwt issued at future|issued at future/i.test(message);
}

async function getAccessToken() {
  if (!supabase) return null;

  let { data, error } = await supabase.auth.getSession();
  let session = data?.session;

  if (!session && !error) {
    const refreshResult = await supabase.auth.refreshSession();
    error = refreshResult.error;
    session = refreshResult.data?.session;
  }

  if (error) {
    console.warn('Supabase session lookup failed:', error);
    return null;
  }

  return session?.access_token || null;
}

async function request(path, options = {}, retryCount = 0) {
  const method = (options.method || 'GET').toUpperCase();
  const requestKey = `${method}:${path}:${JSON.stringify(options.body ?? '')}`;

  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const executeRequest = async () => {
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const requiresAuth = PROTECTED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
    const token = await getAccessToken();

    if (requiresAuth && !token) {
      throw new Error('Authentication required. Please sign in again.');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${SERVER_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && retryCount === 0 && supabase) {
      const refreshResult = await supabase.auth.refreshSession();
      const refreshedToken = refreshResult.data?.session?.access_token;

      if (!refreshResult.error && refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken}`);
        return request(path, { ...options, headers }, 1);
      }

      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore sign-out failures during the auth reset flow.
      }

      if (requiresAuth) {
        throw new Error('Authentication required. Please sign in again.');
      }
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (isFutureJwtError(payload)) {
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {
            // Ignore sign-out failures during the auth reset flow.
          }
        }
        throw new Error('Your device clock is ahead of the server. Please sign in again.');
      }

      throw new Error(payload.error || 'Request failed');
    }

    return payload;
  };

  const requestPromise = executeRequest();
  pendingRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(requestKey);
  }
}

export function getKanjiCards() {
  return request('/api/kanji-cards');
}

export function generateCards(count = 10) {
  return request(`/api/generate-cards?count=${count}`, { method: 'POST' });
}

export function getKanaCards() {
  return request('/api/kana-cards');
}

export function generateGrammarAssessment(maxLesson = 12, count = 10) {
  const safeMaxLesson = Number.isFinite(Number(maxLesson)) ? Number(maxLesson) : 12;
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 10;

  return request(`/api/assessments/generate?type=grammar&maxLesson=${safeMaxLesson}&count=${safeCount}`);
}

export function recordKanjiAttempt(attempt) {
  return request('/api/kanji-attempts', {
    method: 'POST',
    body: JSON.stringify(attempt),
  });
}

export function getKanjiAttempts() {
  return request('/api/kanji-attempts');
}

export function updateKanjiConfidenceBatch(updates) {
  return request('/api/kanji-attempts/confidence', {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  });
}

export function getGrammarLessons() {
  return request('/api/grammar-lessons');
}

export function getRoom(roomCode) {
  return request(`/api/rooms/${encodeURIComponent(roomCode)}`);
}

export function getFriends() {
  return request('/api/friends');
}

export function searchUsers(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return Promise.resolve([]);
  return request(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
}

export function getFriendRequests() {
  return request('/api/friend-requests');
}

export function sendFriendRequest(userId) {
  return request(`/api/friend-requests/${encodeURIComponent(userId)}`, { method: 'POST' });
}

export function acceptFriendRequest(requestId) {
  return request(`/api/friend-requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST' });
}

export function rejectFriendRequest(requestId) {
  return request(`/api/friend-requests/${encodeURIComponent(requestId)}/reject`, { method: 'POST' });
}

export function removeFriend(userId) {
  return request(`/api/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}