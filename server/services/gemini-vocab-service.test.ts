import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStageVocabPrompt,
  N5_CURRICULUM_STAGES,
  normalizeVocabBatch,
} from './gemini-vocab-service.js';

function validItem() {
  return {
    kanji: '食べる',
    kana: 'たべる',
    furigana: '食[た]べる',
    theme: 'Food and meals',
    stage_number: 1,
    english: ['to eat'],
    pos: 'verb',
    metadata: {
      verb_group: 'ichidan',
      transitivity: 'transitive',
      textbook_reference: 'Genki I Lesson 3',
      nuance: null,
    },
    examples: [
      { ja: 'りんごを食べます。', en: 'I eat an apple.', furigana: 'りんごを食[た]べます。' },
      { ja: '朝ごはんを食べました。', en: 'I ate breakfast.', furigana: '朝[あさ]ごはんを食[た]べました。' },
    ],
  };
}

test('N5 curriculum contains 28 ordered stages', () => {
  assert.equal(N5_CURRICULUM_STAGES.length, 28);
  assert.deepEqual(N5_CURRICULUM_STAGES[0], {
    stage: 1,
    theme: 'Greetings & Classroom',
    focus: 'Basic greetings, courtesy phrases, classroom objects, instructions',
  });
  assert.equal(N5_CURRICULUM_STAGES[27].stage, 28);
});

test('createStageVocabPrompt scopes generation to the requested stage', () => {
  const prompt = createStageVocabPrompt({
    level: 'N5',
    stageNumber: 5,
    totalStages: 28,
    theme: 'Basic Daily Verbs',
    focusAreas: 'Eating, drinking, sleeping',
    targetCount: 25,
  });

  assert.match(prompt, /JLPT N5/);
  assert.match(prompt, /Stage 5 of 28/);
  assert.match(prompt, /Basic Daily Verbs/);
  assert.match(prompt, /Eating, drinking, sleeping/);
  assert.match(prompt, /stage_number.*5/);
  assert.match(prompt, /approximately 25/);
});

test('normalizeVocabBatch accepts valid structured vocabulary', () => {
  const items = normalizeVocabBatch(JSON.stringify([validItem()]));
  assert.equal(items[0].furigana, '食[た]べる');
  assert.equal(items[0].stage_number, 1);
  assert.equal(items[0].theme, 'Food and meals');
  assert.equal(items[0].examples.length, 2);
});

test('normalizeVocabBatch defaults omitted metadata to an empty object', () => {
  const item = validItem();
  const { metadata: _metadata, ...itemWithoutMetadata } = item;

  const [normalized] = normalizeVocabBatch(JSON.stringify([itemWithoutMetadata]));
  assert.deepEqual(normalized.metadata, {});
});

test('normalizeVocabBatch rejects unsupported POS values', () => {
  const item = validItem();
  item.pos = 'adjective';
  assert.throws(() => normalizeVocabBatch(JSON.stringify([item])), /Invalid vocabulary/);
});

test('normalizeVocabBatch rejects non-positive stage numbers', () => {
  const item = validItem();
  item.stage_number = 0;
  assert.throws(() => normalizeVocabBatch(JSON.stringify([item])), /Invalid vocabulary/);
});

test('normalizeVocabBatch rejects vocabulary without examples', () => {
  const item = validItem();
  item.examples = [];
  assert.throws(() => normalizeVocabBatch(JSON.stringify([item])), /Invalid vocabulary/);
});