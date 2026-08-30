import { useEffect, useRef, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAppContext } from '../contexts/AppContext';

/** Cross-device streak bookkeeping stored on `public.profiles` (migration 017). */
export type ProfileStreak = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
};

/**
 * Last successfully fetched streak, kept per user id so screens render the
 * previous value instantly (screen navigation, tab switches) while a fresh
 * read is in flight instead of flashing 0.
 */
let cachedStreak: { userId: string; value: ProfileStreak } | null = null;

/**
 * Reads the signed-in user's streak bookkeeping from their own profile row.
 * RLS limits the read to the caller's row. Returns the last known value for
 * the user (null only while signed out or on the very first load) and
 * refreshes silently in the background.
 */
export default function useProfileStreak(): ProfileStreak | null {
  const { user } = useAppContext();
  // Key everything on the id: the auth listener hands back a fresh User
  // object for events like TOKEN_REFRESHED (e.g. on tab refocus), and keying
  // on the object identity would needlessly reset and refetch the streak.
  const userId = user?.id ?? null;
  const [streak, setStreak] = useState<ProfileStreak | null>(null);
  const loadedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (loadedForUserRef.current !== userId) {
      loadedForUserRef.current = userId;
      // Viewer changed (login, logout, first mount): seed from the cache so
      // the previous count stays on screen instead of flashing 0.
      setStreak(userId && cachedStreak?.userId === userId ? cachedStreak.value : null);
    }

    if (!userId || !supabase) return undefined;

    supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_active_date')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('Unable to load profile streak:', error);
          return;
        }
        if (!data) return;

        const next: ProfileStreak = {
          currentStreak: Number(data.current_streak ?? 0),
          longestStreak: Number(data.longest_streak ?? 0),
          lastActiveDate: (data.last_active_date as string | null) ?? null,
        };
        cachedStreak = { userId, value: next };
        setStreak(next);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return streak;
}
