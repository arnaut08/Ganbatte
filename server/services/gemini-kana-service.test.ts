import test from 'node:test';
import assert from 'node:assert/strict';
import { createKanaDeckPrompt, normalizeKanaDeck } from './gemini-kana-service.js';

const categories = ['hiragana', 'hiragana', 'katakana', 'katakana', 'dakuten', 'dakuten', 'dakuten', 'handakuten', 'handakuten', 'handakuten'];

function validDeck() {
  return categories.map((category, index) => ({
    kana: `${category} ${index}`,
    romaji: `${category} ${index}`,
    english: 'random kana phrase',
    category,
  }));
}

test('createKanaDeckPrompt requires a balanced meaningful Kana deck', () => {
  const prompt = createKanaDeckPrompt();
  assert.match(prompt, /exactly 10 unique, natural, and grammatically correct/);
  assert.match(prompt, /3 to 6 words each/);
  assert.match(prompt, /exactly 2 items.*entirely in Hiragana/);
  assert.match(prompt, /exactly 2 items.*entirely in Katakana/);
  assert.match(prompt, /exactly 3 items.*voiced characters/);
  assert.match(prompt, /exactly 3 items.*semi-voiced characters/);
});

test('normalizeKanaDeck accepts exactly ten balanced items and removes category metadata', () => {
  const [first] = normalizeKanaDeck(JSON.stringify(validDeck()));
  assert.deepEqual(first, {
    kana: 'hiragana 0',
    romaji: 'hiragana 0',
    english: 'random kana phrase',
  });
});

test('normalizeKanaDeck rejects an unbalanced deck', () => {
  const deck = validDeck();
  deck[9].category = 'dakuten';
  assert.throws(() => normalizeKanaDeck(JSON.stringify(deck)), /unbalanced Kana deck/);
});
