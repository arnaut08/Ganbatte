import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

export async function getPersistedGenkiLessons() {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabaseClient()
    .from('grammar_lessons')
    .select('lesson_number, content, content_version, model, generated_at')
    .eq('status', 'published')
    .order('lesson_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPersistedGenkiLesson(lessonNumber) {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabaseClient()
    .from('grammar_lessons')
    .select('lesson_number, content, content_version, model, generated_at')
    .eq('lesson_number', lessonNumber)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function upsertGenkiLesson({ lessonNumber, content, contentVersion, model }) {
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
  return data;
}