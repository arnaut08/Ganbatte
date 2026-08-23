import { roomSocketData } from '../utils/socket-room-utils.js';
import { generateRandomCards, generateRandomKanjiCards } from '../services/card-service.js';
import { KANA_SENTENCES } from '../data/kana-sentences.js';
import { KANJI_CARDS, KANJI_GROUPS } from '../data/kanji.js';
import { KANA_CARDS, KANA_GROUPS, KANA_MATRICES } from '../data/kana.js';
import { cardCountSchema, roomCodeSchema } from '../utils/validation.js';

export function getKanaCards(_req, res) {
  res.json({ groups: KANA_GROUPS, cards: KANA_CARDS, matrices: KANA_MATRICES });
}

export function getKanjiCards(_req, res) {
  res.json({ groups: KANJI_GROUPS, cards: KANJI_CARDS });
}

export function getRoomByCode(req, res) {
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

export function generateCards(req, res) {
  const parsedCount = cardCountSchema.safeParse(req.query.count);
  if (!parsedCount.success) {
    res.status(400).json({ error: 'Count must be an integer between 1 and 25' });
    return;
  }

  const rawType = String(req.query.type || 'kana').toLowerCase();
  const deckType = rawType === 'kanji' ? 'kanji' : 'kana';
  const rawGroups = Array.isArray(req.query.groups)
    ? req.query.groups
    : typeof req.query.groups === 'string'
      ? [req.query.groups]
      : [];

  const cards = deckType === 'kanji'
    ? generateRandomKanjiCards(rawGroups, parsedCount.data)
    : generateRandomCards(KANA_SENTENCES, parsedCount.data);

  res.json({ type: deckType, groups: rawGroups, cards });
}

