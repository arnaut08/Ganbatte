import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAppContext } from '../contexts/AppContext';

/** Cross-device streak bookkeeping stored on `public.profiles` (migration 017). */
export type ProfileStreak = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
};

/**
 * Reads the signed-in user's streak bookkeeping from their own profile row.
 * RLS limits the read to the caller's row. Returns null while signed out,
 * while Supabase is not configured, or while the row is loading/missing.
 */
export default function useProfileStreak(): ProfileStreak | null {
  const { user } = useAppContext();
  const [streak, setStreak] = useState<ProfileStreak | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStreak(null);
    if (!user || !supabase) return undefined;

    supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_active_date')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('Unable to load profile streak:', error);
          return;
        }
        if (data) {
          setStreak({
            currentStreak: Number(data.current_streak ?? 0),
            longestStreak: Number(data.longest_streak ?? 0),
            lastActiveDate: (data.last_active_date as string | null) ?? null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return streak;
}
