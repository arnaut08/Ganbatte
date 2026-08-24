import { areRomajiAnswersEqual } from './romaji.js';

export function buildKanaAttempt({ card, answer, usedHint = false }) {
  return {
    characterId: card?.id,
    character: card?.kana || '',
    characterType: 'kana',
    promptMode: 'reading',
    answer: String(answer || '').trim(),
    correct: areRomajiAnswersEqual(answer, card?.romaji || ''),
    usedHint: Boolean(usedHint),
  };
}