import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authRequired = Boolean(supabase);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    // Keep the previous User object identity whenever the id is unchanged:
    // auth events like TOKEN_REFRESHED (fired when a hidden tab regains
    // focus) deliver a fresh object for the same user, and swapping it in
    // needlessly re-renders every `user` consumer.
    const mergeUser = (current: User | null, nextUser: User | null) =>
      (current?.id ?? null) === (nextUser?.id ?? null) ? current : nextUser;

    supabase.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user || null;
      setUser((current) => mergeUser(current, nextUser));
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null;
      setUser((current) => mergeUser(current, nextUser));
      setAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const getDisplayName = useCallback(() => {
    const fullName = user?.user_metadata?.full_name?.trim();
    if (fullName) return fullName;

    const emailName = user?.email?.split('@')[0]?.trim();
    if (emailName) return emailName;

    return 'Player';
  }, [user]);

  const handleLogout = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  }, []);

  return { user, authLoading, authRequired, getDisplayName, handleLogout };
}
