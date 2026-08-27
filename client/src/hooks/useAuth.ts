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

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
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
