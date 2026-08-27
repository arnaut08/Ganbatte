import { areRomajiAnswersEqual } from './romaji';
import type { KanjiCard, Confidence } from '../types/learning';

export const KANJI_PROMPT_MODES = {
  READING: 'reading',
  MEANING: 'meaning',
};

export const KANJI_CONFIDENCE_LEVELS: Confidence[] = ['again', 'hard', 'easy'];

/** Narrow a free-form confidence value to one of the rated recall levels. */
function isRatedConfidence(value: Confidence | undefined): value is Exclude<Confidence, null | 'unrated'> {
  return value === 'again' || value === 'hard' || value === 'easy';
}

function normalizeMeaning(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ');
}

export function getKanjiPromptAnswer(card: KanjiCard | null | undefined, promptMode: string): string {
  if (promptMode === KANJI_PROMPT_MODES.MEANING) return card?.english || '';
  return card?.romaji || '';
}

export function getKanjiHint(card: KanjiCard | null | undefined, promptMode: string): string {
  if (!card) return '';

  if (promptMode === KANJI_PROMPT_MODES.MEANING) {
    return String(card.reading || '').trim();
  }

    return String(card.english || '').trim();
}

export function isKanjiRecallCorrect(answer: string, card: KanjiCard | null | undefined, promptMode: string): boolean {
  if (!card || !String(answer || '').trim()) return false;

  if (promptMode === KANJI_PROMPT_MODES.MEANING) {
    return normalizeMeaning(answer) === normalizeMeaning(card.english);
  }

  return areRomajiAnswersEqual(answer, card.romaji);
}

export function buildKanjiAttempt({ card, promptMode, answer, confidence, usedHint = false }: { card?: KanjiCard | null; promptMode: string; answer: string; confidence?: Confidence; usedHint?: boolean }) {
  return {
    character: card?.kanji || '',
    promptMode,
    answer: String(answer || '').trim(),
    correct: isKanjiRecallCorrect(answer, card, promptMode),
    confidence: isRatedConfidence(confidence) ? confidence : null,
    usedHint: Boolean(usedHint),
  };
}
