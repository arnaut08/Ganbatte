import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ToastType } from '../types';
import { supabase } from '../config/supabase';

type UseAuthOptions = {
  showToast?: (message: string, type?: ToastType) => void;
};

export default function useAuth(options?: UseAuthOptions) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authRequired = Boolean(supabase);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    const mergeUser = (current: User | null, nextUser: User | null) =>
      (current?.id ?? null) === (nextUser?.id ?? null) ? current : nextUser;

    supabase.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user || null;
      setUser((current) => mergeUser(current, nextUser));
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user || null;
      setUser((current) => mergeUser(current, nextUser));
      setAuthLoading(false);

      // Handle specific auth landing events from URL tokens
      if (event === 'SIGNED_IN') {
        const hash = window.location.hash;
        
        if (hash) {
          if (hash.includes('type=signup') || hash.includes('type=email_change')) {
            options?.showToast?.('Email verified successfully! Welcome to the arena.', 'success');
            window.history.replaceState(null, '', window.location.pathname);
          } else if (hash.includes('type=recovery')) {
            options?.showToast?.('Recovery session initialized. Update your password below.', 'warning');
          }
        }
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [options]);

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