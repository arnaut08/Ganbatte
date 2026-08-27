import { z } from 'zod';
import { generateGrammarAssessment } from '../services/genki-grammar-service.js';
import { getSupabaseClient } from '../config/supabase.js';
import type { Request, Response } from 'express';

const assessmentQuerySchema = z.object({
  maxLesson: z.coerce.number().int().min(1).max(12).default(1),
  count: z.coerce.number().int().min(1).max(25).default(10),
  mode: z.enum(['practice', 'assessment']).default('assessment'),
  type: z.enum(['grammar', 'kana', 'kanji']).default('grammar'),
});

const characterAttemptSchema = z.object({
  characterId: z.string().uuid().optional(),
  character: z.string().trim().regex(/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u),
  characterType: z.enum(['kanji', 'kana']).default('kanji'),
  promptMode: z.enum(['reading', 'meaning']),
  answer: z.string().trim().min(1).max(160),
  correct: z.boolean(),
  confidence: z.enum(['again', 'hard', 'easy']).nullable().optional(),
  usedHint: z.boolean().default(false),
});

const characterConfidenceUpdateSchema = z.object({
  characterId: z.string().uuid().optional(),
  character: z.string().trim().regex(/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u),
  characterType: z.enum(['kanji', 'kana']).default('kanji'),
  confidence: z.enum(['again', 'hard', 'easy']),
});

const kanjiConfidenceBatchSchema = z.object({
  updates: z.array(characterConfidenceUpdateSchema).min(1).max(300),
});

export async function generateAssessment(req: Request, res: Response): Promise<void> {
  const parsed = assessmentQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid assessment request parameters' });
    return;
  }

  const { maxLesson, count, mode, type } = parsed.data;

  if (type !== 'grammar') {
    res.status(400).json({ error: 'Only grammar assessment generation is currently supported' });
    return;
  }

  try {
    const questions = await generateGrammarAssessment({ maxLesson, count, mode });
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

export async function recordKanjiAttempt(req: Request, res: Response): Promise<void> {
  const parsed = characterAttemptSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Kanji attempt' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    let characterId = parsed.data.characterId;
    if (!characterId) {
      const table = parsed.data.characterType === 'kana' ? 'kana_characters' : 'kanji_characters';
      const { data: character, error: lookupError } = await supabase.from(table).select('id').eq('character', parsed.data.character).single();
      if (lookupError) throw lookupError;
      characterId = String(character.id);
    }
    const { data, error } = await supabase.from('character_attempts').upsert({
      user_id: req.user!.id,
      character_id: characterId,
      character: parsed.data.character,
      character_type: parsed.data.characterType,
      prompt_mode: parsed.data.promptMode,
      answer: parsed.data.answer,
      is_correct: parsed.data.correct,
      confidence: parsed.data.confidence ?? null,
      used_hint: parsed.data.usedHint,
    }, { onConflict: 'user_id,character_id,character_type' }).select('character, character_id, character_type, confidence').single();

    if (error) throw error;
    res.status(200).json({ recorded: true, attempt: data });
  } catch (error) {
    console.error('Kanji attempt recording failed:', error);
    res.status(500).json({ error: 'Unable to record Kanji attempt' });
  }
}

export const recordCharacterAttempt = recordKanjiAttempt;

export async function getKanjiAttempts(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('character_attempts')
      .select('character, character_id, character_type, confidence, is_correct, prompt_mode, created_at')
      .eq('user_id', req.user!.id)
      .eq('character_type', 'kanji');

    if (error) throw error;
    res.json({ attempts: data || [] });
  } catch (error) {
    console.error('Kanji attempt lookup failed:', error);
    res.status(500).json({ error: 'Unable to load Kanji attempts' });
  }
}

export async function getCharacterAttempts(req: Request, res: Response): Promise<void> {
  if (req.query.type !== 'kana') return getKanjiAttempts(req, res);
  try {
    const { data, error } = await getSupabaseClient()
      .from('character_attempts')
      .select('character, character_id, character_type, confidence, is_correct, prompt_mode, created_at')
      .eq('user_id', req.user!.id)
      .eq('character_type', 'kana');
    if (error) throw error;
    res.json({ attempts: data || [] });
  } catch (error) {
    console.error('Character attempt lookup failed:', error);
    res.status(500).json({ error: 'Unable to load character attempts' });
  }
}

export async function updateKanjiConfidenceBatch(req: Request, res: Response): Promise<void> {
  const parsed = kanjiConfidenceBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Kanji confidence updates' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const results = await Promise.all(parsed.data.updates.map(async ({ character, characterId, characterType, confidence }) => {
      let resolvedCharacterId = characterId;
      if (!resolvedCharacterId) {
        const table = characterType === 'kana' ? 'kana_characters' : 'kanji_characters';
        const { data: record, error: lookupError } = await supabase.from(table).select('id').eq('character', character).single();
        if (lookupError) return { error: lookupError };
        resolvedCharacterId = String(record.id);
      }
      return supabase
        .from('character_attempts')
        .update({ confidence })
        .eq('user_id', req.user!.id)
        .eq('character_id', resolvedCharacterId)
        .eq('character_type', characterType)
        .select('character, character_id, character_type, confidence')
        .single();
    }));

    const failedResult = results.find(({ error }) => error);
    if (failedResult?.error) throw failedResult.error;

    res.json({ updated: results.map((result) => ('data' in result ? result.data : null)) });
  } catch (error) {
    console.error('Kanji confidence batch update failed:', error);
    res.status(500).json({ error: 'Unable to update Kanji confidence' });
  }
}

export const updateCharacterConfidenceBatch = updateKanjiConfidenceBatch;
