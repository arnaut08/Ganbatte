import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';
import type { VocabCard } from '../services/card-service.js';

type VocabRow = {
  id: string;
  kanji: string;
  kana: string;
  romaji: string | null;
  english: string[];
  stage_number: number;
  theme: string;
  pos: string;
};

export async function getPersistedVocabDeck(): Promise<VocabCard[] | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await getSupabaseClient()
    .from('vocab_items')
    .select('id, kanji, kana, romaji, english, stage_number, theme, pos')
    .eq('jlpt_level', 'N5')
    .order('stage_number')
    .order('id');
  if (error) throw error;
  return data?.length
    ? (data as VocabRow[]).map((item) => ({
      id: item.id,
      kanji: item.kanji,
      kana: item.kana,
      romaji: item.romaji,
      english: item.english,
      stageNumber: item.stage_number,
      theme: item.theme,
      pos: item.pos,
    }))
    : null;
}