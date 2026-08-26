import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env.js';

type ServerDatabase = {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
      Relationships: [];
    }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, never>;
  };
};

let supabaseClient: ReturnType<typeof createClient<ServerDatabase>> | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseClient(): ReturnType<typeof createClient<ServerDatabase>> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  supabaseClient ??= createClient<ServerDatabase>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}
