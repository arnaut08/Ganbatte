import { areRomajiAnswersEqual } from './romaji';
import type { KanaCard } from '../types/learning';

export type KanaAttempt = {
  characterId?: string;
  character: string;
  characterType: 'kana';
  promptMode: 'reading';
  answer: string;
  correct: boolean;
  usedHint: boolean;
};

export function buildKanaAttempt({ card, answer, usedHint = false }: { card?: KanaCard | null; answer: string; usedHint?: boolean }): KanaAttempt {
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
