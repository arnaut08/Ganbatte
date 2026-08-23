import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildKanjiAttempt,
  getKanjiHint,
  getKanjiPromptAnswer,
  isKanjiRecallCorrect,
} from './kanjiRecall.js';

const card = { kanji: '学', romaji: 'gaku', meaning: 'study; learning' };

test('checks reading prompts with existing romaji normalization', () => {
  assert.equal(isKanjiRecallCorrect(' GAKU ', card, 'reading'), true);
  assert.equal(isKanjiRecallCorrect('gakko', card, 'reading'), false);
});

test('checks meaning prompts without requiring punctuation or case', () => {
  assert.equal(isKanjiRecallCorrect('Study / learning', card, 'meaning'), true);
  assert.equal(isKanjiRecallCorrect('school', card, 'meaning'), false);
});

test('returns the answer and records a normalized attempt shape', () => {
  assert.equal(getKanjiPromptAnswer(card, 'reading'), 'gaku');
  assert.equal(getKanjiPromptAnswer(card, 'meaning'), 'study; learning');
  assert.deepEqual(buildKanjiAttempt({
    card,
    promptMode: 'reading',
    answer: 'gaku',
    confidence: 'easy',
    usedHint: true,
  }), {
    character: '学',
    promptMode: 'reading',
    answer: 'gaku',
    correct: true,
    confidence: 'easy',
    usedHint: true,
  });
});

test('returns a useful hint for each prompt mode', () => {
  const detailedCard = { ...card, reading: 'がく' };

  assert.equal(getKanjiHint(detailedCard, 'reading'), 'study; learning');
  assert.equal(getKanjiHint(detailedCard, 'meaning'), 'がく');
});
