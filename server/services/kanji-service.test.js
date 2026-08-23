import test from 'node:test';
import assert from 'node:assert/strict';
import { createKanjiPrompt, normalizeKanjiDeck } from './kanji-service.js';

test('createKanjiPrompt makes the current-character-only example rule explicit', () => {
  const prompt = createKanjiPrompt();
  assert.match(prompt, /Valid example for 木/);
  assert.match(prompt, /Invalid example for 木/);
  assert.match(prompt, /extremely easy for an N5 learner/);
  assert.match(prompt, /concrete everyday noun and the correct kana counter/);
  assert.match(prompt, /do not generate ten near-identical/);
  assert.match(prompt, /valid compact JSON/);
});

function validDeck() {
  return JSON.stringify({
    groups: Array.from({ length: 7 }, (_, groupIndex) => ({
      id: `group-${groupIndex}`,
      name: `Group ${groupIndex}`,
      characters: Array.from({ length: 8 }, (_, characterIndex) => ({
        character: String.fromCodePoint(0x3400 + groupIndex * 8 + characterIndex),
        readings: ['かな'],
        romaji: 'kana',
        meaning: 'meaning',
        example: { japanese: `${String.fromCodePoint(0x3400 + groupIndex * 8 + characterIndex)}です。`, english: 'This is it.' },
      })),
    })),
  });
}

test('normalizeKanjiDeck accepts a Gemini-selected number of grouped characters', () => {
  const deck = normalizeKanjiDeck(validDeck());
  assert.equal(deck.groups.length, 7);
  assert.equal(deck.groups.flatMap((group) => group.characters).length, 56);
});

test('normalizeKanjiDeck rejects duplicate characters', () => {
  const deck = JSON.parse(validDeck());
  deck.groups[1].characters[0].character = deck.groups[0].characters[0].character;
  assert.throws(() => normalizeKanjiDeck(JSON.stringify(deck)), /distinct characters/);
});

test('normalizeKanjiDeck rejects another Kanji in an example', () => {
  const deck = JSON.parse(validDeck());
  const character = deck.groups[0].characters[0].character;
  deck.groups[0].characters[0].example.japanese = `${character}日です。`;
  assert.throws(() => normalizeKanjiDeck(JSON.stringify(deck)), /another Kanji character/);
});