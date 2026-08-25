// @ts-check

import { getSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

/** @typedef {{ lesson_number: number, content: unknown, content_version: string | null, model: string | null, generated_at: string | null }} GenkiLesson */

/** @returns {Promise<GenkiLesson[]>} */
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

/** @param {number} lessonNumber @returns {Promise<GenkiLesson | null>} */
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

/** @param {{ lessonNumber: number, content: unknown, contentVersion: string, model: string }} input @returns {Promise<GenkiLesson>} */
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