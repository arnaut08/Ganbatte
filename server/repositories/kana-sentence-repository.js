import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

export async function getRandomKanaSentences(count = 10, difficulty = 'n5') {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseClient()
    .rpc('get_random_kana_sentences', {
      requested_count: count,
      requested_difficulty: difficulty,
    });

  if (error) throw error;
  return data || [];
}
