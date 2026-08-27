import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

export interface GenkiLesson { lesson_number: number; content: unknown; content_version: string | null; model: string | null; generated_at: string | null }

/** @returns {Promise<GenkiLesson[]>} */
export async function getPersistedGenkiLessons(): Promise<GenkiLesson[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseClient()
    .from('grammar_lessons')
    .select('lesson_number, content, content_version, model, generated_at')
    .eq('status', 'published')
    .order('lesson_number', { ascending: true });

  if (error) throw error;
  return (data || []) as unknown as GenkiLesson[];
}

/** @param {number} lessonNumber @returns {Promise<GenkiLesson | null>} */
export async function getPersistedGenkiLesson(lessonNumber: number): Promise<GenkiLesson | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseClient()
    .from('grammar_lessons')
    .select('lesson_number, content, content_version, model, generated_at')
    .eq('lesson_number', lessonNumber)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  return (data || null) as unknown as GenkiLesson | null;
}

/** @param {{ lessonNumber: number, content: unknown, contentVersion: string, model: string }} input @returns {Promise<GenkiLesson>} */
export async function upsertGenkiLesson({ lessonNumber, content, contentVersion, model }: { lessonNumber: number; content: unknown; contentVersion: string; model: string }): Promise<GenkiLesson> {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured');

  const { data, error } = await getSupabaseClient()
    .from('grammar_lessons')
    .upsert({
      lesson_number: lessonNumber,
      content,
      content_version: contentVersion,
      model,
      status: 'published',
      generated_at: new Date().toISOString(),
    }, { onConflict: 'lesson_number' })
    .select('lesson_number, content, content_version, model, generated_at')
    .single();

  if (error) throw error;
  return data as unknown as GenkiLesson;
}
