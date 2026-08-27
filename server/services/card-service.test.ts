import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRandomKanjiCards } from './card-service.js';

test('generateRandomKanjiCards builds a random 10-card deck from the selected groups', () => {
  const kanjiCards = Array.from({ length: 10 }, (_, index) => ({
    kanji: String(index + 1),
    reading: 'いち',
    meaning: 'one',
    groupId: index % 2 === 0 ? 'numbers' : 'people-family',
    groupName: index % 2 === 0 ? 'Numbers' : 'People',
  }));
  const cards = generateRandomKanjiCards(kanjiCards, ['numbers', 'people-family'], 10);

  assert.equal(cards.length, 10);
  assert.ok(cards.every((card) => ['numbers', 'people-family'].includes(card.groupId ?? '')));
  assert.ok(cards.every((card) => card.kana && card.romaji && card.english));
  assert.ok(cards.every((card) => /[a-z\s]+/.test(card.romaji)));
});
