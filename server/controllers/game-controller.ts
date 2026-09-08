import { roomSocketData } from '../utils/socket-room-utils.js';
import { generateRandomCards, generateRandomKanjiCards, type KanjiCard } from '../services/card-service.js';
import { KANA_SENTENCES } from '../data/kana-sentences.js';
import { getPersistedKanaDeck } from '../repositories/kana-repository.js';
import { getPersistedKanjiDeck } from '../repositories/kanji-repository.js';
import { getSupabaseClient } from '../config/supabase.js';
import { cardCountSchema, roomCodeSchema } from '../utils/validation.js';
import { z } from 'zod';
import type { Request, Response } from 'express';

interface GameRequest extends Request {
  query: Request['query'] & { count?: string; type?: string; groups?: string | string[] };
}

export async function getKanaCards(_req: Request, res: Response): Promise<void> {
  try {
    const deck = await getPersistedKanaDeck();
    if (!deck) {
      res.status(503).json({ error: 'Kana lessons are not available.' });
      return;
    }
    res.json(deck);
  } catch (error) {
    console.error('Kana lesson lookup failed:', error);
    res.status(503).json({ error: 'Kana lessons are not available.' });
  }
}

export async function getKanjiCards(req: Request, res: Response): Promise<void> {
  try {
    const deck = await getPersistedKanjiDeck();
    if (!deck) {
      res.status(503).json({ error: 'Kanji lessons are not available.' });
      return;
    }
    const { data: progress, error: progressError } = await getSupabaseClient()
      .from('user_kanji_progress')
      .select('character_id, srs_stage, next_review_at')
      .eq('user_id', req.user!.id);
    if (progressError) throw progressError;
    const progressById = new Map((progress || []).map((item) => [String(item.character_id), item]));
    res.json({
      ...deck,
      cards: deck.cards.map((card) => ({ ...card, progress: progressById.get(String(card.id)) || null })),
      groups: deck.groups.map((group) => ({ ...group, cards: group.cards.map((card) => ({ ...card, progress: progressById.get(String(card.id)) || null })) })),
    });
  } catch (error) {
    console.error('Kanji lesson lookup failed:', error);
    res.status(503).json({ error: 'Kanji lessons are not available.' });
  }
}

export async function getKanjiOverview(req: Request, res: Response): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const [{ data: groups, error: groupsError }, { data: characters, error: charactersError }, { data: progress, error: progressError }, { data: quizzes, error: quizzesError }] = await Promise.all([
      supabase.from('kanji_groups').select('id, name, sort_order').eq('difficulty', 'n5').eq('status', 'published').order('sort_order'),
      supabase.from('kanji_characters').select('id, group_id').eq('difficulty', 'n5').eq('status', 'published'),
      supabase.from('user_kanji_progress').select('character_id, srs_stage, next_review_at').eq('user_id', req.user!.id),
      supabase.from('user_kanji_quiz_results').select('group_id, passed').eq('user_id', req.user!.id),
    ]);
    if (groupsError) throw groupsError;
    if (charactersError) throw charactersError;
    if (progressError) throw progressError;
    if (quizzesError) throw quizzesError;
    const progressById = new Map((progress || []).map((item) => [String(item.character_id), item]));
    const passedGroups = new Set((quizzes || []).filter((quiz) => quiz.passed).map((quiz) => String(quiz.group_id)));
    const overview = (groups || []).map((group) => {
      const items = (characters || []).filter((character) => character.group_id === group.id);
      const learned = items.filter((item) => Number(progressById.get(String(item.id))?.srs_stage || 0) >= 1).length;
      const mastered = items.filter((item) => Number(progressById.get(String(item.id))?.srs_stage || 0) >= 4).length;
      const due = items.filter((item) => { const nextReview = progressById.get(String(item.id))?.next_review_at; return nextReview && new Date(String(nextReview)).getTime() <= Date.now(); }).length;
      const quizPassed = passedGroups.has(String(group.id));
      return { group_id: String(group.id), theme: String(group.name), total_characters: items.length, learned_characters: learned, mastered_characters: mastered, due_characters: due, quiz_passed: quizPassed, is_cleared: learned === items.length && quizPassed, is_mastered: mastered === items.length && quizPassed };
    });
    res.json({ groups: overview });
  } catch (error) {
    console.error('Kanji overview lookup failed:', error);
    res.status(500).json({ error: 'Unable to load Kanji overview.' });
  }
}

export async function getKanjiGroup(req: Request<{ groupId: string }>, res: Response): Promise<void> {
  const groupId = z.string().regex(/^[a-z0-9-]+$/).safeParse(req.params.groupId);
  if (!groupId.success) { res.status(400).json({ error: 'Invalid Kanji group.' }); return; }
  try {
    const supabase = getSupabaseClient();
    const [{ data: items, error: itemsError }, { data: progress, error: progressError }] = await Promise.all([
      supabase.from('kanji_characters').select('id, character, readings, romaji, meaning, example_japanese, example_english, group_id').eq('group_id', groupId.data).eq('status', 'published').order('sort_order'),
      supabase.from('user_kanji_progress').select('character_id, srs_stage, next_review_at').eq('user_id', req.user!.id),
    ]);
    if (itemsError) throw itemsError;
    if (progressError) throw progressError;
    const progressById = new Map((progress || []).map((item) => [String(item.character_id), item]));
    res.json({ group_id: groupId.data, items: (items || []).map((item) => ({ id: item.id, kanji: item.character, reading: (item.readings as string[]).join(' / '), romaji: item.romaji, meaning: item.meaning, groupId: item.group_id, example: [item.example_japanese, item.example_english], progress: progressById.get(String(item.id)) || null })) });
  } catch (error) {
    console.error('Kanji group lookup failed:', error);
    res.status(500).json({ error: 'Unable to load Kanji group.' });
  }
}

export async function saveKanjiQuizResult(req: Request, res: Response): Promise<void> {
  const parsed = z.object({ groupId: z.string().regex(/^[a-z0-9-]+$/), score: z.number().int().nonnegative(), totalQuestions: z.number().int().positive(), passed: z.boolean() }).refine((value) => value.score <= value.totalQuestions).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid Kanji quiz result.' }); return; }
  try {
    const supabase = getSupabaseClient();
    const { data: previous, error: previousError } = await supabase.from('user_kanji_quiz_results').select('passed').eq('user_id', req.user!.id).eq('group_id', parsed.data.groupId).maybeSingle();
    if (previousError) throw previousError;
    const { data, error } = await supabase.from('user_kanji_quiz_results').upsert({ user_id: req.user!.id, group_id: parsed.data.groupId, score: parsed.data.score, total_questions: parsed.data.totalQuestions, passed: parsed.data.passed || previous?.passed === true, completed_at: new Date().toISOString() }, { onConflict: 'user_id,group_id' }).select('*').single();
    if (error) throw error;
    res.json({ result: data });
  } catch (error) {
    console.error('Kanji quiz result save failed:', error);
    res.status(500).json({ error: 'Unable to save Kanji quiz result.' });
  }
}

export function getRoomByCode(req: Request<{ code: string }>, res: Response): void {
  const parsedCode = roomCodeSchema.safeParse(req.params.code);
  if (!parsedCode.success) {
    res.status(400).json({ error: 'Invalid room code' });
    return;
  }

  const code = parsedCode.data;
  const room = roomSocketData.rooms.get(code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  res.json(room);
}

export async function generateCards(req: GameRequest, res: Response): Promise<void> {
  const parsedCount = cardCountSchema.safeParse(req.query.count);
  if (!parsedCount.success) {
    res.status(400).json({ error: 'Count must be an integer between 1 and 25' });
    return;
  }

  const rawType = String(req.query.type || 'kana').toLowerCase();
  const deckType = rawType === 'kanji' ? 'kanji' : 'kana';
  const rawGroups: string[] = Array.isArray(req.query.groups)
    ? req.query.groups.map(String)
    : typeof req.query.groups === 'string'
      ? [req.query.groups]
      : [];

  let cards;
  if (deckType === 'kanji') {
    try {
      const deck = await getPersistedKanjiDeck();
      if (!deck) {
        res.status(503).json({ error: 'Kanji lessons are not available.' });
        return;
      }
      cards = generateRandomKanjiCards(deck.cards as unknown as KanjiCard[], rawGroups, parsedCount.data);
    } catch (error) {
      console.error('Kanji card generation failed:', error);
      res.status(503).json({ error: 'Kanji lessons are not available.' });
      return;
    }
  } else {
    cards = generateRandomCards(KANA_SENTENCES, parsedCount.data);
  }

  res.json({ type: deckType, groups: rawGroups, cards });
}
