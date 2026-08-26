import { roomSocketData } from '../utils/socket-room-utils.js';
import { generateRandomCards, generateRandomKanjiCards, type KanjiCard } from '../services/card-service.js';
import { KANA_SENTENCES } from '../data/kana-sentences.js';
import { getPersistedKanaDeck } from '../repositories/kana-repository.js';
import { getPersistedKanjiDeck } from '../repositories/kanji-repository.js';
import { cardCountSchema, roomCodeSchema } from '../utils/validation.js';
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

export async function getKanjiCards(_req: Request, res: Response): Promise<void> {
  try {
    const deck = await getPersistedKanjiDeck();
    if (!deck) {
      res.status(503).json({ error: 'Kanji lessons are not available.' });
      return;
    }
    res.json(deck);
  } catch (error) {
    console.error('Kanji lesson lookup failed:', error);
    res.status(503).json({ error: 'Kanji lessons are not available.' });
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
