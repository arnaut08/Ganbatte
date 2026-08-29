import { z } from 'zod';
import { getSupabaseClient } from '../config/supabase.js';
import { calculateSrsUpdate } from '../services/vocab-progress-service.js';
import type { Request, Response } from 'express';

const levelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
const overviewQuerySchema = z.object({ level: levelSchema.default('N5') });
const stageQuerySchema = z.object({ level: levelSchema.default('N5') });
const filterQuerySchema = z.object({
  level: levelSchema.default('N5'),
  pos: z.string().trim().min(1).optional(),
  theme: z.string().trim().min(1).optional(),
  unlearnedOnly: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
});
const stageParamsSchema = z.coerce.number().int().positive();
const reviewSchema = z.object({
  vocab_id: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});
const markAgainSchema = z.object({ vocab_id: z.string().uuid() });
const stageQuizResultSchema = z.object({
  level: levelSchema,
  stageNumber: z.number().int().positive(),
  score: z.number().int().nonnegative(),
  totalQuestions: z.number().int().positive(),
  passed: z.boolean(),
}).refine((value) => value.score <= value.totalQuestions, { message: 'Score cannot exceed total questions.' });

type VocabRow = Record<string, unknown> & { id: string; stage_number: number; theme: string };
type ProgressRow = Record<string, unknown> & { vocab_id: string; srs_stage: number };
const PROGRESS_QUERY_BATCH_SIZE = 100;

async function getProgressMap(userId: string, vocabIds?: string[]): Promise<Map<string, ProgressRow>> {
  const ids = vocabIds || [];
  if (vocabIds && ids.length === 0) return new Map();

  const batches = vocabIds
    ? Array.from({ length: Math.ceil(ids.length / PROGRESS_QUERY_BATCH_SIZE) }, (_, index) => (
      ids.slice(index * PROGRESS_QUERY_BATCH_SIZE, (index + 1) * PROGRESS_QUERY_BATCH_SIZE)
    ))
    : [undefined];
  const results = await Promise.all(batches.map(async (batch) => {
    let query = getSupabaseClient()
      .from('user_vocab_progress')
      .select('*')
      .eq('user_id', userId);
    if (batch) query = query.in('vocab_id', batch);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as ProgressRow[];
  }));

  return new Map(results.flat().map((row) => [row.vocab_id, row]));
}

function withProgress(items: VocabRow[], progress: Map<string, ProgressRow>) {
  return items.map((item) => ({ ...item, progress: progress.get(item.id) || null }));
}

export async function getVocabOverview(req: Request, res: Response): Promise<void> {
  const parsed = overviewQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid vocabulary level.' });
    return;
  }

  try {
    const rpcClient = getSupabaseClient() as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: Error | null }> };
    const { data, error } = await rpcClient.rpc('get_vocab_stage_overview', { p_level: parsed.data.level, p_user_id: req.user!.id });
    if (error) throw error;
    res.json({ level: parsed.data.level, stages: data || [] });
  } catch (error) {
    console.error('Vocabulary overview lookup failed:', error);
    res.status(500).json({ error: 'Unable to load vocabulary overview.' });
  }
}

export async function saveStageQuizResult(req: Request, res: Response): Promise<void> {
  const parsed = stageQuizResultSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid stage quiz result.' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const { data: previousResult, error: previousResultError } = await supabase
      .from('user_stage_quiz_results')
      .select('passed')
      .eq('user_id', req.user!.id)
      .eq('jlpt_level', parsed.data.level)
      .eq('stage_number', parsed.data.stageNumber)
      .maybeSingle();
    if (previousResultError) throw previousResultError;

    const { data, error } = await getSupabaseClient()
      .from('user_stage_quiz_results')
      .upsert({
        user_id: req.user!.id,
        jlpt_level: parsed.data.level,
        stage_number: parsed.data.stageNumber,
        score: parsed.data.score,
        total_questions: parsed.data.totalQuestions,
        passed: parsed.data.passed || previousResult?.passed === true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,jlpt_level,stage_number' })
      .select('*')
      .single();
    if (error) throw error;
    res.json({ result: data });
  } catch (error) {
    console.error('Stage quiz result save failed:', error);
    res.status(500).json({ error: 'Unable to save stage quiz result.' });
  }
}

export async function getVocabStage(req: Request<{ stageNumber: string }>, res: Response): Promise<void> {
  const query = stageQuerySchema.safeParse(req.query);
  const stage = stageParamsSchema.safeParse(req.params.stageNumber);
  if (!query.success || !stage.success) {
    res.status(400).json({ error: 'Invalid vocabulary level or stage number.' });
    return;
  }

  try {
    const { data, error } = await getSupabaseClient().from('vocab_items').select('*').eq('jlpt_level', query.data.level).eq('stage_number', stage.data).order('id');
    if (error) throw error;
    const items = (data || []) as unknown as VocabRow[];
    res.json({ level: query.data.level, stage_number: stage.data, items: withProgress(items, await getProgressMap(req.user!.id, items.map((item) => item.id))) });
  } catch (error) {
    console.error('Vocabulary stage lookup failed:', error);
    res.status(500).json({ error: 'Unable to load vocabulary stage.' });
  }
}

export async function filterVocab(req: Request, res: Response): Promise<void> {
  const parsed = filterQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid vocabulary filter.' });
    return;
  }

  try {
    let query = getSupabaseClient().from('vocab_items').select('*').eq('jlpt_level', parsed.data.level);
    if (parsed.data.pos) query = query.eq('pos', parsed.data.pos);
    if (parsed.data.theme) query = query.eq('theme', parsed.data.theme);
    const { data, error } = await query.order('stage_number').order('id');
    if (error) throw error;
    const items = (data || []) as unknown as VocabRow[];
    const progress = await getProgressMap(req.user!.id, items.map((item) => item.id));
    const filtered = parsed.data.unlearnedOnly ? items.filter((item) => !progress.has(item.id) || (progress.get(item.id)?.srs_stage || 0) === 0) : items;
    res.json({ level: parsed.data.level, items: withProgress(filtered, progress) });
  } catch (error) {
    console.error('Vocabulary filter lookup failed:', error);
    res.status(500).json({ error: 'Unable to filter vocabulary.' });
  }
}

export async function reviewVocab(req: Request, res: Response): Promise<void> {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid vocabulary review.' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const { data: vocab, error: vocabError } = await supabase.from('vocab_items').select('id').eq('id', parsed.data.vocab_id).maybeSingle();
    if (vocabError) throw vocabError;
    if (!vocab) {
      res.status(404).json({ error: 'Vocabulary item not found.' });
      return;
    }
    const { data: current, error: currentError } = await supabase.from('user_vocab_progress').select('srs_stage, interval_days, ease_factor, repetitions').eq('user_id', req.user!.id).eq('vocab_id', parsed.data.vocab_id).maybeSingle();
    if (currentError) throw currentError;
    const update = calculateSrsUpdate(current as Partial<{ srs_stage: number; interval_days: number; ease_factor: number; repetitions: number }> | null, parsed.data.rating);
    const { data, error } = await supabase.from('user_vocab_progress').upsert({ user_id: req.user!.id, vocab_id: parsed.data.vocab_id, ...update }, { onConflict: 'user_id,vocab_id' }).select('*').single();
    if (error) throw error;
    res.json({ progress: data });
  } catch (error) {
    console.error('Vocabulary review failed:', error);
    res.status(500).json({ error: 'Unable to record vocabulary review.' });
  }
}

export async function markVocabAgain(req: Request, res: Response): Promise<void> {
  const parsed = markAgainSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid vocabulary item.' });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const { data: vocab, error: vocabError } = await supabase
      .from('vocab_items')
      .select('id')
      .eq('id', parsed.data.vocab_id)
      .maybeSingle();
    if (vocabError) throw vocabError;
    if (!vocab) {
      res.status(404).json({ error: 'Vocabulary item not found.' });
      return;
    }

    const nextReviewAt = new Date().toISOString();
    const { data: existingProgress, error: progressLookupError } = await supabase
      .from('user_vocab_progress')
      .select('id')
      .eq('user_id', req.user!.id)
      .eq('vocab_id', parsed.data.vocab_id)
      .maybeSingle();
    if (progressLookupError) throw progressLookupError;

    const progressQuery = existingProgress
      ? supabase.from('user_vocab_progress').update({ srs_stage: 1, next_review_at: nextReviewAt }).eq('id', String(existingProgress.id))
      : supabase.from('user_vocab_progress').insert({ user_id: req.user!.id, vocab_id: parsed.data.vocab_id, srs_stage: 1, next_review_at: nextReviewAt });
    const { data, error } = await progressQuery.select('*').single();
    if (error) throw error;
    res.json({ progress: data });
  } catch (error) {
    console.error('Vocabulary mark-again failed:', error);
    res.status(500).json({ error: 'Unable to mark vocabulary for review.' });
  }
}