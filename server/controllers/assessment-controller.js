import { z } from 'zod';
import { generateGrammarAssessment } from '../services/genki-grammar-service.js';
import { getSupabaseClient } from '../config/supabase.js';

const assessmentQuerySchema = z.object({
  maxLesson: z.coerce.number().int().min(1).max(12).default(1),
  count: z.coerce.number().int().min(1).max(25).default(10),
  type: z.enum(['grammar', 'kana', 'kanji']).default('grammar'),
});

const kanjiAttemptSchema = z.object({
  character: z.string().trim().regex(/^\p{Script=Han}$/u),
  promptMode: z.enum(['reading', 'meaning']),
  answer: z.string().trim().min(1).max(160),
  correct: z.boolean(),
  confidence: z.enum(['again', 'hard', 'easy']).nullable().optional(),
  usedHint: z.boolean().default(false),
});

const kanjiConfidenceUpdateSchema = z.object({
  character: z.string().trim().regex(/^\p{Script=Han}$/u),
  confidence: z.enum(['again', 'hard', 'easy']),
});

const kanjiConfidenceBatchSchema = z.object({
  updates: z.array(kanjiConfidenceUpdateSchema).min(1).max(100),
});

export async function generateAssessment(req, res) {
  const parsed = assessmentQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid assessment request parameters' });
    return;
  }

  const { maxLesson, count, type } = parsed.data;

  if (type !== 'grammar') {
    res.status(400).json({ error: 'Only grammar assessment generation is currently supported' });
    return;
  }

  try {
    const questions = await generateGrammarAssessment({ maxLesson, count });
    res.json({
      type,
      maxLesson,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error('Assessment generation failed:', error);
    res.status(500).json({ error: 'Assessment generation failed' });
  }
}

export async function recordKanjiAttempt(req, res) {
  const parsed = kanjiAttemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Kanji attempt' });
    return;
  }

  try {
    const { data, error } = await getSupabaseClient().from('kanji_attempts').upsert({
      user_id: req.user.id,
      character: parsed.data.character,
      prompt_mode: parsed.data.promptMode,
      answer: parsed.data.answer,
      is_correct: parsed.data.correct,
      confidence: parsed.data.confidence ?? null,
      used_hint: parsed.data.usedHint,
    }, { onConflict: 'user_id,character' }).select('character, confidence').single();

    if (error) throw error;
    res.status(200).json({ recorded: true, attempt: data });
  } catch (error) {
    console.error('Kanji attempt recording failed:', error);
    res.status(500).json({ error: 'Unable to record Kanji attempt' });
  }
}

export async function getKanjiAttempts(req, res) {
  try {
    const { data, error } = await getSupabaseClient()
      .from('kanji_attempts')
      .select('character, confidence, is_correct, prompt_mode, created_at')
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ attempts: data || [] });
  } catch (error) {
    console.error('Kanji attempt lookup failed:', error);
    res.status(500).json({ error: 'Unable to load Kanji attempts' });
  }
}

export async function updateKanjiConfidenceBatch(req, res) {
  const parsed = kanjiConfidenceBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Kanji confidence updates' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const results = await Promise.all(parsed.data.updates.map(({ character, confidence }) => (
      supabase
        .from('kanji_attempts')
        .update({ confidence })
        .eq('user_id', req.user.id)
        .eq('character', character)
        .select('character, confidence')
        .single()
    )));

    const failedResult = results.find(({ error }) => error);
    if (failedResult?.error) throw failedResult.error;

    res.json({ updated: results.map(({ data }) => data) });
  } catch (error) {
    console.error('Kanji confidence batch update failed:', error);
    res.status(500).json({ error: 'Unable to update Kanji confidence' });
  }
}
