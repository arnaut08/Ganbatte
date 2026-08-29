import { SERVER_URL } from '../config';
import { supabase } from '../config/supabase';
import type {
  ApiRecord,
  AttemptInput,
  CardDeck,
  CharacterAttempt,
  Friend,
  FriendRequest,
  GrammarAssessment,
  GrammarQuestion,
  KanaCard,
  KanjiCard,
  Room,
  VocabOverview,
  VocabFilterItem,
  VocabStudyItem,
} from '../types';

const PROTECTED_PATH_PREFIXES = [
  '/api/friends',
  '/api/friend-requests',
  '/api/users/search',
  '/api/assessments',
  '/api/grammar-lessons',
  '/api/kana-cards',
  '/api/kanji-cards',
  '/api/character-attempts',
  '/api/kanji-attempts',
  '/api/rooms',
  '/api/generate-cards',
  '/api/vocab',
];

const pendingRequests = new Map<string, Promise<unknown>>();

function isFutureJwtError(error: unknown): boolean {
  const message = String(
    error && typeof error === 'object' && 'message' in error
      ? error.message
      : error || '',
  );
  return /jwt issued at future|issued at future/i.test(message);
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) return undefined;
  const error = payload.error;
  return typeof error === 'string' ? error : undefined;
}

async function getAccessToken(): Promise<string | null> {
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

async function request<T>(path: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const requestKey = `${method}:${path}:${JSON.stringify(options.body ?? '')}`;

  const pendingRequest = pendingRequests.get(requestKey);
  if (pendingRequest) return pendingRequest as Promise<T>;

  const executeRequest = async (): Promise<T> => {
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const requiresAuth = PROTECTED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
    const token = await getAccessToken();

    if (requiresAuth && !token) {
      throw new Error('Authentication required. Please sign in again.');
    }

    if (token) headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(`${SERVER_URL}${path}`, { ...options, headers });

    if (response.status === 401 && retryCount === 0 && supabase) {
      const refreshResult = await supabase.auth.refreshSession();
      const refreshedToken = refreshResult.data?.session?.access_token;

      if (!refreshResult.error && refreshedToken) {
        headers.set('Authorization', `Bearer ${refreshedToken}`);
        return request<T>(path, { ...options, headers }, 1);
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

    const payload: unknown = await response.json().catch(() => ({}));

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

      throw new Error(getErrorMessage(payload) || 'Request failed');
    }

    return payload as T;
  };

  const requestPromise = executeRequest();
  pendingRequests.set(requestKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(requestKey);
  }
}

export function getKanjiCards(): Promise<CardDeck<KanjiCard>> {
  return request('/api/kanji-cards');
}

export function generateCards(count = 10): Promise<CardDeck<KanaCard | KanjiCard>> {
  return request(`/api/generate-cards?count=${count}`, { method: 'POST' });
}

export function getKanaCards(): Promise<CardDeck<KanaCard>> {
  return request('/api/kana-cards');
}

export function getVocabOverview(level = 'N5'): Promise<VocabOverview> {
  return request(`/api/vocab/overview?level=${encodeURIComponent(level)}`);
}

export function getVocabFilter(level = 'N5', pos?: string): Promise<{ level: string; items: VocabFilterItem[] }> {
  const params = new URLSearchParams({ level });
  if (pos) params.set('pos', pos);
  return request(`/api/vocab/filter?${params.toString()}`);
}

export function getVocabStage(stageNumber: number, level = 'N5'): Promise<{ level: string; stage_number: number; items: VocabStudyItem[] }> {
  return request(`/api/vocab/stage/${encodeURIComponent(stageNumber)}?level=${encodeURIComponent(level)}`);
}

export function reviewVocab(vocabId: string, rating: 1 | 2 | 3 | 4): Promise<{ progress: ApiRecord }> {
  return request('/api/vocab/review', {
    method: 'POST',
    body: JSON.stringify({ vocab_id: vocabId, rating }),
  });
}

export function generateGrammarAssessment(
  maxLesson = 12,
  count = 10,
  mode = 'practice',
): Promise<GrammarAssessment> {
  const safeMaxLesson = Number.isFinite(Number(maxLesson)) ? Number(maxLesson) : 12;
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 10;

  return request(`/api/assessments/generate?type=grammar&maxLesson=${safeMaxLesson}&count=${safeCount}&mode=${mode}`);
}

export function recordKanjiAttempt(attempt: AttemptInput): Promise<ApiRecord> {
  return request('/api/kanji-attempts', {
    method: 'POST',
    body: JSON.stringify(attempt),
  });
}

export function getKanjiAttempts(): Promise<{ attempts: CharacterAttempt[] }> {
  return request('/api/kanji-attempts');
}

export function updateKanjiConfidenceBatch(updates: AttemptInput[]): Promise<ApiRecord> {
  return request('/api/kanji-attempts/confidence', {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  });
}

export function recordCharacterAttempt(attempt: AttemptInput): Promise<ApiRecord> {
  return request('/api/character-attempts', {
    method: 'POST',
    body: JSON.stringify(attempt),
  });
}

export function getCharacterAttempts(characterType: string): Promise<{ attempts: CharacterAttempt[] }> {
  return request(`/api/character-attempts?type=${encodeURIComponent(characterType)}`);
}

export function updateCharacterConfidenceBatch(updates: AttemptInput[]): Promise<ApiRecord> {
  return request('/api/character-attempts/confidence', {
    method: 'PATCH',
    body: JSON.stringify({ updates }),
  });
}

export function getGrammarLessons(): Promise<ApiRecord[]> {
  return request('/api/grammar-lessons');
}

export function getRoom(roomCode: string): Promise<Room> {
  return request(`/api/rooms/${encodeURIComponent(roomCode)}`);
}

export function getFriends(): Promise<Friend[]> {
  return request('/api/friends');
}

export function searchUsers(query: string): Promise<Friend[]> {
  const trimmed = String(query || '').trim();
  if (!trimmed) return Promise.resolve([]);
  return request(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
}

export function getFriendRequests(): Promise<FriendRequest[]> {
  return request('/api/friend-requests');
}

export function sendFriendRequest(userId: string): Promise<ApiRecord> {
  return request(`/api/friend-requests/${encodeURIComponent(userId)}`, { method: 'POST' });
}

export function acceptFriendRequest(requestId: string): Promise<ApiRecord> {
  return request(`/api/friend-requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST' });
}

export function rejectFriendRequest(requestId: string): Promise<ApiRecord> {
  return request(`/api/friend-requests/${encodeURIComponent(requestId)}/reject`, { method: 'POST' });
}

export function removeFriend(userId: string): Promise<ApiRecord> {
  return request(`/api/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' });
}
