import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

export interface KanaSentenceRow { kana: string; romaji: string; english: string; [key: string]: unknown }

export async function getRandomKanaSentences(count: number = 10, difficulty: string = 'n5'): Promise<KanaSentenceRow[] | null> {
  if (!isSupabaseConfigured()) return null;

  const rpc = getSupabaseClient() as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: Error | null }> };
  const { data, error } = await rpc.rpc('get_random_kana_sentences', {
      requested_count: count,
      requested_difficulty: difficulty,
    });

  if (error) throw error;
  return (data || []) as KanaSentenceRow[];
}
