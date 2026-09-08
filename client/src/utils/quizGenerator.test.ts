import assert from 'node:assert/strict';
import test from 'node:test';
import { generateVocabQuiz } from './quizGenerator';
import type { VocabStudyItem } from '../types';

const items: VocabStudyItem[] = [1, 2, 3, 4].map((number) => ({
  id: `word-${number}`,
  kanji: `語${number}`,
  kana: `ご${number}`,
  furigana: `語${number}[ご${number}]`,
  theme: 'Test',
  stage_number: 1,
  english: [`meaning ${number}`],
  pos: 'noun',
  examples: [{ ja: '例文', en: 'Example', furigana: '例文[れいぶん]' }],
}));

test('generateVocabQuiz creates four choices and both question directions', () => {
  const questions = generateVocabQuiz(items, 4, () => 0.5);

  assert.equal(questions.length, 4);
  assert.deepEqual(questions.map((question) => question.type), [
    'japanese-to-english',
    'english-to-japanese',
    'japanese-to-english',
    'english-to-japanese',
  ]);
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    assert.ok(question.options.includes(question.correctAnswer));
  }
});