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
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  );
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
      if (!window.location.hash.includes('type=recovery')) {
        setUser((current) => mergeUser(current, nextUser));
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user || null;
      setAuthLoading(false);

      if (event === 'SIGNED_IN') {
        const hash = window.location.hash;

        if (hash) {
          if (hash.includes('type=signup') || hash.includes('type=email_change')) {
            setUser((current) => mergeUser(current, nextUser));
            window.history.replaceState(null, '', window.location.pathname);

            // Defer the toast slightly to ensure the layout has mounted and can render it
            setTimeout(() => {
              options?.showToast?.('Email verified successfully! Welcome to the arena.', 'success');
            }, 100);
          } else if (hash.includes('type=recovery')) {
            setIsPasswordRecovery(true);
            options?.showToast?.('Recovery session initialized. Update your password below.', 'neutral');
            // Do NOT set regular user state yet so they stay on the reset screen
            return;
          }
        }
      }

      if (!isPasswordRecovery) {
        setUser((current) => mergeUser(current, nextUser));
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [options, isPasswordRecovery]);

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
    setIsPasswordRecovery(false);
  }, []);

  return { user, authLoading, authRequired, isPasswordRecovery, setIsPasswordRecovery, getDisplayName, handleLogout };
}