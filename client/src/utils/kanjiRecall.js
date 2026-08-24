import { areRomajiAnswersEqual } from './romaji.js';

export const KANJI_PROMPT_MODES = {
  READING: 'reading',
  MEANING: 'meaning',
};

export const KANJI_CONFIDENCE_LEVELS = ['again', 'hard', 'easy'];

function normalizeMeaning(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ');
}

export function getKanjiPromptAnswer(card, promptMode) {
  if (promptMode === KANJI_PROMPT_MODES.MEANING) return card?.meaning || '';
  return card?.romaji || '';
}

export function getKanjiHint(card, promptMode) {
  if (!card) return '';

  if (promptMode === KANJI_PROMPT_MODES.MEANING) {
    return String(card.reading || '').trim();
  }

  return String(card.meaning || '').trim();
}

export function isKanjiRecallCorrect(answer, card, promptMode) {
  if (!card || !String(answer || '').trim()) return false;

  if (promptMode === KANJI_PROMPT_MODES.MEANING) {
    return normalizeMeaning(answer) === normalizeMeaning(card.meaning);
  }

  return areRomajiAnswersEqual(answer, card.romaji);
}

export function buildKanjiAttempt({ card, promptMode, answer, confidence, usedHint = false }) {
  return {
    character: card?.kanji || card?.character || '',
    promptMode,
    answer: String(answer || '').trim(),
    correct: isKanjiRecallCorrect(answer, card, promptMode),
    confidence: KANJI_CONFIDENCE_LEVELS.includes(confidence) ? confidence : null,
    usedHint: Boolean(usedHint),
  };
}
