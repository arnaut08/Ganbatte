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
  GrammarOverviewResponse,
  GrammarQuestion,
  KanaCard,
  KanjiCard,
  KanjiGroupOverview,
  PvpRecord,
  Room,
  UserActivity,
  VocabOverview,
  VocabFilterItem,
  VocabStudyItem,
} from '../types';

export type SaveStageQuizPayload = {
  level: string;
  stageNumber: number;
  score: number;
  totalQuestions: number;
  passed: boolean;
};

const PROTECTED_PATH_PREFIXES = [
  '/api/activity',
  '/api/friends',
  '/api/friend-requests',
  '/api/users/search',
  '/api/assessments',
  '/api/grammar-lessons',
  '/api/kana-cards',
  '/api/kanji-cards',
  '/api/character-attempts',
  '/api/kanji-attempts',
  '/api/pvp-record',
  '/api/rooms',
  '/api/generate-cards',
  '/api/vocab',
  '/api/account',
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
  if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_VISUAL_TEST__) {
    return 'mock-jwt-token';
  }

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

export function getActiveMatchSession(sessionKey: string): Promise<{
  user_in_active_match: boolean;
  room: Room | null;
}> {
  return request(`/api/assessments/active-session?sessionKey=${encodeURIComponent(sessionKey)}`);
}

export function getKanjiOverview(): Promise<{ groups: KanjiGroupOverview[] }> {
  return request('/api/kanji/overview');
}

export function getKanjiGroup(groupId: string): Promise<{ group_id: string; items: KanjiCard[] }> {
  return request(`/api/kanji/group/${encodeURIComponent(groupId)}`);
}

export function saveKanjiQuizResult(payload: { groupId: string; score: number; totalQuestions: number; passed: boolean }): Promise<{ result: ApiRecord }> {
  return request('/api/kanji/quiz-results', { method: 'POST', body: JSON.stringify(payload) });
}

export function reviewKanji(characterId: string, rating: 1 | 2 | 3 | 4): Promise<{ progress: ApiRecord }> {
  return request('/api/kanji/review', {
    method: 'POST',
    body: JSON.stringify({ character_id: characterId, rating }),
  });
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

export function markVocabAgain(vocabId: string): Promise<{ progress: ApiRecord }> {
  return request('/api/vocab/mark-again', {
    method: 'POST',
    body: JSON.stringify({ vocab_id: vocabId }),
  });
}

export function saveStageQuizResult(payload: SaveStageQuizPayload): Promise<{ result: ApiRecord }> {
  return request('/api/vocab/quiz-results', {
    method: 'POST',
    body: JSON.stringify(payload),
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

export type SaveGrammarQuizPayload = {
  /** Genki lesson the quiz covered; 0 marks a mixed-lesson (bridging) session. */
  lessonNumber: number;
  totalQuestions: number;
  correctCount: number;
  scorePercentage: number;
  passed: boolean;
};

/**
 * Persists one completed Genki grammar practice quiz in the
 * `grammar_quiz_results` table. `lessonNumber` 0 is reserved for
 * mixed-lesson sessions, which the overview RPC ignores when aggregating
 * per-lesson progress for the Mastery Passport.
 */
export async function saveGrammarQuizResult(payload: SaveGrammarQuizPayload): Promise<ApiRecord> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user?.id) {
    throw new Error('Authentication required. Please sign in again.');
  }

  const { data, error } = await supabase
    .from('grammar_quiz_results')
    .insert({
      user_id: session.user.id,
      lesson_number: payload.lessonNumber,
      total_questions: payload.totalQuestions,
      correct_count: payload.correctCount,
      score_percentage: payload.scorePercentage,
      passed: payload.passed,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ApiRecord;
}

/** Aggregated Genki grammar progress via the `get_grammar_overview` RPC. */
export async function getGrammarOverview(): Promise<GrammarOverviewResponse> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id
    || (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_VISUAL_TEST__
      ? 'test-user-id'
      : undefined);
  if (!userId) throw new Error('Authentication required. Please sign in again.');

  const { data, error } = await supabase.rpc('get_grammar_overview', { user_id_input: userId });
  if (error) throw error;
  return (data ?? { total_lessons: 12, lessons: [] }) as GrammarOverviewResponse;
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

/** Aggregated multiplayer 1v1 record for the Mastery Passport snapshot. */
export function getPvpRecord(): Promise<{ record: PvpRecord }> {
  return request('/api/pvp-record');
}

/**
 * Records a key learning action (first correct Kana recall, Vocab stage
 * clear, Kanji session completion, PvP match end). The server-side RPC keeps
 * streaks/tiers consistent across devices.
 */
export function recordUserActivity(): Promise<{ activity: UserActivity }> {
  return request('/api/activity', { method: 'POST' });
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

export function deleteAccount(): Promise<void> {
  return request('/api/account', { method: 'DELETE' });
}
