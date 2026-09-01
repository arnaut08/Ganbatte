import { z } from 'zod';
import { roomState } from '../utils/socket-room-utils.js';

export function getActiveMatchSession(req: Request, res: Response): void {
  const userId = req.user?.id;
  const sessionKey = typeof req.query.sessionKey === 'string' ? req.query.sessionKey : '';
  const activeRoom = [...roomState.rooms.values()].find((room) => (
    (room.status === 'active' || room.status === 'preparing')
    && room.players.some((player) => (
      (userId && player.userId === userId) || (sessionKey && player.sessionKey === sessionKey)
    ))
  ));

  res.json({
    user_in_active_match: Boolean(activeRoom),
    room: activeRoom || null,
  });
}
import { generateGrammarAssessment } from '../services/genki-grammar-service.js';
import { getSupabaseClient } from '../config/supabase.js';
import { calculateSrsUpdate } from '../services/vocab-progress-service.js';
import { computePvpRecord, type PvpResultRow } from '../services/pvp-record-service.js';
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

const kanjiReviewSchema = z.object({
  character_id: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
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

export async function reviewKanji(req: Request, res: Response): Promise<void> {
  const parsed = kanjiReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid Kanji review' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const { data: character, error: characterError } = await supabase
      .from('kanji_characters')
      .select('id')
      .eq('id', parsed.data.character_id)
      .maybeSingle();
    if (characterError) throw characterError;
    if (!character) {
      res.status(404).json({ error: 'Kanji character not found.' });
      return;
    }

    const { data: current, error: currentError } = await supabase
      .from('user_kanji_progress')
      .select('srs_stage, interval_days, ease_factor, repetitions')
      .eq('user_id', req.user!.id)
      .eq('character_id', parsed.data.character_id)
      .maybeSingle();
    if (currentError) throw currentError;

    const update = calculateSrsUpdate(
      current as Partial<{ srs_stage: number; interval_days: number; ease_factor: number; repetitions: number }> | null,
      parsed.data.rating,
    );
    const { data, error } = await supabase
      .from('user_kanji_progress')
      .upsert({ user_id: req.user!.id, character_id: parsed.data.character_id, ...update }, { onConflict: 'user_id,character_id' })
      .select('*')
      .single();
    if (error) throw error;
    res.json({ progress: data });
  } catch (error) {
    console.error('Kanji review failed:', error);
    res.status(500).json({ error: 'Unable to record Kanji review' });
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

    // Streak-based mastery: a correct answer bumps the streak by one, any miss
    // resets it to zero, and total_attempts always grows by one. The columns are
    // added by migration 016; if it hasn't run yet we fall back to the legacy
    // record shape so existing deployments keep working.
    let current: { correct_streak?: number; total_attempts?: number } | null = null;
    try {
      const { data: currentRow, error: currentError } = await supabase
        .from('character_attempts')
        .select('correct_streak, total_attempts')
        .eq('user_id', req.user!.id)
        .eq('character_id', characterId)
        .eq('character_type', parsed.data.characterType)
        .maybeSingle();
      if (currentError) throw currentError;
      const currentRowValue = (currentRow || null) as { correct_streak?: number; total_attempts?: number } | null;
      current = currentRowValue;
    } catch {
      current = null;
    }

    const correctStreak = parsed.data.correct
      ? Number(current?.correct_streak ?? 0) + 1
      : 0;
    const totalAttempts = Number(current?.total_attempts ?? 0) + 1;

    const attemptRow = {
      user_id: req.user!.id,
      character_id: characterId,
      character: parsed.data.character,
      character_type: parsed.data.characterType,
      prompt_mode: parsed.data.promptMode,
      answer: parsed.data.answer,
      is_correct: parsed.data.correct,
      confidence: parsed.data.confidence ?? null,
      used_hint: parsed.data.usedHint,
      correct_streak: correctStreak,
      total_attempts: totalAttempts,
    };

    const trySaveAttempt = async (row: Record<string, unknown>, columns: string) => {
      const supabaseClient = getSupabaseClient();
      const result = await supabaseClient
        .from('character_attempts')
        .upsert(row, { onConflict: 'user_id,character_id,character_type' })
        .select(columns)
        .single();
      return result as unknown as { data: Record<string, unknown> | null; error: unknown };
    };

    const WITH_STREAK_COLUMNS = 'character, character_id, character_type, correct_streak, total_attempts';
    const LEGACY_COLUMNS = 'character, character_id, character_type, confidence';
    let saved = await trySaveAttempt(attemptRow, WITH_STREAK_COLUMNS);

    if (saved.error && isMissingColumnError(saved.error)) {
      saved = await trySaveAttempt({
        user_id: req.user!.id,
        character_id: characterId,
        character: parsed.data.character,
        character_type: parsed.data.characterType,
        prompt_mode: parsed.data.promptMode,
        answer: parsed.data.answer,
        is_correct: parsed.data.correct,
        confidence: parsed.data.confidence ?? null,
        used_hint: parsed.data.usedHint,
      }, LEGACY_COLUMNS);
    }

    if (saved.error) throw saved.error;
    res.status(200).json({ recorded: true, attempt: saved.data });
  } catch (error) {
    console.error('Kanji attempt recording failed:', error);
    res.status(500).json({ error: 'Unable to record Kanji attempt' });
  }
}

export const recordCharacterAttempt = recordKanjiAttempt;

/** True when a Supabase/Postgres error means the streak columns from migration
 * 016 are missing (older databases that haven't applied it yet). */
function isMissingColumnError(error: unknown): boolean {
  const message = String(
    error && typeof error === 'object' && 'message' in error
      ? error.message
      : error || '',
  );
  return /column .* does not exist|no such column|undefined column/i.test(message);
}

const ATTEMPT_COLUMNS_WITH_STREAK =
  'character, character_id, character_type, confidence, is_correct, prompt_mode, created_at, correct_streak, total_attempts';
const ATTEMPT_COLUMNS_LEGACY =
  'character, character_id, character_type, confidence, is_correct, prompt_mode, created_at';

type AttemptListResult = { data: Record<string, unknown>[] | null; error: unknown };

async function selectAttemptsForUser(userId: string, characterType: 'kana' | 'kanji'): Promise<AttemptListResult> {
  const supabase = getSupabaseClient();
  const queryFor = async (columns: string): Promise<AttemptListResult> => {
    const result = await supabase
      .from('character_attempts')
      .select(columns)
      .eq('user_id', userId)
      .eq('character_type', characterType);
    return result as unknown as AttemptListResult;
  };

  const result = await queryFor(ATTEMPT_COLUMNS_WITH_STREAK);
  if (result.error && isMissingColumnError(result.error)) {
    return queryFor(ATTEMPT_COLUMNS_LEGACY);
  }
  return result;
}

export async function getKanjiAttempts(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await selectAttemptsForUser(req.user!.id, 'kanji');
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
    const { data, error } = await selectAttemptsForUser(req.user!.id, 'kana');
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

const PVP_RESULT_COLUMNS =
  'id, assessment_type, score_percentage, total_questions, created_at, companion_user_id';

/**
 * Aggregated multiplayer 1v1 record for the Mastery Passport.
 *
 * Each player of a match saves their own `assessment_results` row, and RLS
 * hides other players' rows from the client, so the win pairing (comparing
 * the user's score against the opponent's counterpart row) must happen here
 * with the service-role client.
 */
export async function getPvpRecord(req: Request, res: Response): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const userId = req.user!.id;

    const { data: myRows, error: myError } = await supabase
      .from('assessment_results')
      .select(PVP_RESULT_COLUMNS)
      .eq('user_id', userId)
      .not('companion_user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);
    if (myError) throw myError;

    const rows = ((myRows || []) as unknown as PvpResultRow[]).filter(
      (row): row is PvpResultRow & { companion_user_id: string } => Boolean(row.companion_user_id),
    );

    let opponentRows: PvpResultRow[] = [];
    const opponentIds = [...new Set(rows.map((row) => row.companion_user_id))];
    if (opponentIds.length > 0) {
      const { data, error: opponentError } = await supabase
        .from('assessment_results')
        .select(PVP_RESULT_COLUMNS)
        .in('user_id', opponentIds)
        .eq('companion_user_id', userId)
        .limit(1000);
      if (opponentError) throw opponentError;
      opponentRows = (data || []) as unknown as PvpResultRow[];
    }

    res.json({ record: computePvpRecord(rows, opponentRows) });
  } catch (error) {
    console.error('PvP record lookup failed:', error);
    res.status(500).json({ error: 'Unable to load multiplayer record' });
  }
}
