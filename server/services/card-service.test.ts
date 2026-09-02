import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRandomKanjiCards, generateRandomVocabCards } from './card-service.js';

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

test('generateRandomVocabCards displays the word and normalizes its answer', () => {
  const cards = generateRandomVocabCards([
    { id: 'one', kanji: '食べる', kana: 'たべる', romaji: 'taberu', english: ['to eat'], stageNumber: 1 },
    { id: 'two', kanji: '見る', kana: 'みる', romaji: null, english: ['to see', 'to watch'], stageNumber: 2 },
  ], 2, ['2']);

  assert.equal(cards.length, 1);
  assert.equal(cards[0].id, 'two');
  assert.equal(cards[0].romaji, 'mi ru');
  assert.equal(cards[0].english, 'to see / to watch');
  assert.equal(cards[0].questionType, 'multiple-choice');
  assert.equal(cards[0].answerType, 'text');
  assert.ok(cards.every((card) => card.promptKind === 'kanji' || card.promptKind === 'english'));
});

test('generateRandomVocabCards alternates Japanese and English multiple-choice prompts', () => {
  const cards = generateRandomVocabCards([
    { id: 'one', kanji: '食べる', kana: 'たべる', romaji: 'taberu', english: ['to eat'], stageNumber: 1 },
    { id: 'two', kanji: '見る', kana: 'みる', romaji: 'miru', english: ['to see'], stageNumber: 1 },
  ], 2);

  assert.deepEqual(cards.map((card) => card.questionType), ['multiple-choice', 'multiple-choice']);
  assert.deepEqual(cards.map((card) => card.promptKind), ['kanji', 'english']);
  assert.ok(cards[0].options?.every((option) => !/[a-z]/.test(option) || /^[A-Z]/.test(option)));
  assert.ok(cards[1].prompt && /^[A-Z]/.test(cards[1].prompt));
  assert.ok(cards.every((card) => (card.options?.length ?? 0) > 0));
});

test('generateRandomVocabCards randomizes the correct option position', () => {
  const cards = generateRandomVocabCards([
    { id: 'one', kanji: '食べる', kana: 'たべる', romaji: 'taberu', english: ['to eat'], stageNumber: 1 },
    { id: 'two', kanji: '見る', kana: 'みる', romaji: 'miru', english: ['to see'], stageNumber: 1 },
    { id: 'three', kanji: '行く', kana: 'いく', romaji: 'iku', english: ['to go'], stageNumber: 1 },
    { id: 'four', kanji: '来る', kana: 'くる', romaji: 'kuru', english: ['to come'], stageNumber: 1 },
  ], 1, [], () => 0);

  assert.equal(cards[0].options?.indexOf(cards[0].correctAnswer || ''), 3);
});

test('generateRandomVocabCards uses distractors from the same stage as each question', () => {
  const cards = generateRandomVocabCards([
    { id: 'one', kanji: '食べる', kana: 'たべる', romaji: 'taberu', english: ['to eat'], stageNumber: 1 },
    { id: 'two', kanji: '見る', kana: 'みる', romaji: 'miru', english: ['to see'], stageNumber: 1 },
    { id: 'three', kanji: '行く', kana: 'いく', romaji: 'iku', english: ['to go'], stageNumber: 1 },
    { id: 'four', kanji: '来る', kana: 'くる', romaji: 'kuru', english: ['to come'], stageNumber: 2 },
  ], 1, ['1', '2'], () => 0);

  assert.ok(cards[0].options?.every((option) => ['To Eat', 'To See', 'To Go'].includes(option)));
  assert.ok(!cards[0].options?.includes('To Come'));
});
