import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ToastType } from '../types';
import { supabase } from '../config/supabase';

type UseAuthOptions = {
  showToast?: (message: string, type?: ToastType) => void;
};

export default function useAuth(options?: UseAuthOptions) {
  // Playwright visual regression test bypass
  if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_VISUAL_TEST__) {
    return {
      user: {
        id: 'test-user-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@ganbatte.app',
        app_metadata: {},
        user_metadata: { full_name: 'Test Learner' },
        created_at: new Date().toISOString(),
      } as User,
      authLoading: false,
      authRequired: true,
      isPasswordRecovery: false,
      setIsPasswordRecovery: () => { },
      isEmailVerifiedSignup: false,
      setIsEmailVerifiedSignup: () => { },
      getDisplayName: () => 'Test Learner',
      handleLogout: async () => { },
    };
  }

  const showToast = options?.showToast;
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=recovery')
  );
  const [isEmailVerifiedSignup, setIsEmailVerifiedSignup] = useState(
    () => typeof window !== 'undefined' && (
      window.location.hash.includes('type=signup') || window.location.hash.includes('type=email_change')
    )
  );
  const authRequired = Boolean(supabase);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    const mergeUser = (current: User | null, nextUser: User | null) => {
      if (!current || !nextUser) return nextUser;
      if (
        current.id === nextUser.id
        && current.email === nextUser.email
        && current.updated_at === nextUser.updated_at
        && JSON.stringify(current.user_metadata) === JSON.stringify(nextUser.user_metadata)
      ) {
        return current;
      }
      return nextUser;
    };

    supabase.auth.getSession().then(({ data }) => {
      const nextUser = data.session?.user || null;
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const isSpecialAuthFlow = hash.includes('type=recovery');

      if (!isSpecialAuthFlow) {
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
            setIsEmailVerifiedSignup(true);
            setUser((current) => mergeUser(current, nextUser));
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }

          if (hash.includes('type=recovery')) {
            setIsPasswordRecovery(true);
            showToast?.('Recovery session initialized. Update your password below.', 'neutral');
            return;
          }
        }
      }

      if (!isPasswordRecovery) {
        setUser((current) => mergeUser(current, nextUser));
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [isPasswordRecovery, showToast]);

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
    setIsEmailVerifiedSignup(false);
  }, []);

  return {
    user,
    authLoading,
    authRequired,
    isPasswordRecovery,
    setIsPasswordRecovery,
    isEmailVerifiedSignup,
    setIsEmailVerifiedSignup,
    getDisplayName,
    handleLogout,
  };
}