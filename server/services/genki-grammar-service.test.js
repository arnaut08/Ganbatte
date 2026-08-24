import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGrammarAssessment,
  createGeminiPrompt,
  GENKI_GRAMMAR_LESSONS,
  resolveGeminiModel,
} from './genki-grammar-service.js';

test('buildGrammarAssessment keeps practice questions in the selected lesson', () => {
  const assessment = buildGrammarAssessment({ maxLesson: 2, count: 6 });

  assert.equal(assessment.length, 6);
  assert.ok(assessment.every((item) => item.lesson === 2));
  assert.ok(assessment.every((item) => ['multiple-choice', 'fill-in-the-blank', 'matching', 'translation', 'comprehension'].includes(item.type)));
  assert.ok(assessment.every((item) => item.prompt && item.explanation));
});

test('assessment mode uses the fixed question distribution while practice honors count', () => {
  const practice = buildGrammarAssessment({ maxLesson: 2, count: 5, mode: 'practice' });
  const assessment = buildGrammarAssessment({ maxLesson: 2, count: 5, mode: 'assessment' });
  const counts = assessment.reduce((result, item) => ({
    ...result,
    [item.type]: (result[item.type] || 0) + 1,
  }), {});

  assert.equal(practice.length, 5);
  assert.ok(practice.every((item) => item.lesson === 2));
  assert.deepEqual(counts, {
    'multiple-choice': 4,
    'fill-in-the-blank': 4,
    matching: 2,
    translation: 4,
    comprehension: 4,
  });

  const prompt = createGeminiPrompt({ count: 5, mode: 'assessment' });
  assert.match(prompt, /exactly 18 questions/);
  assert.match(prompt, /4 multiple-choice, 4 fill-in-the-blank, 2 matching, 4 translation, and 4 comprehension/);
});

test('resolveGeminiModel falls back for unsupported model names', () => {
  assert.equal(resolveGeminiModel('gemini-2.5-flash-lite'), 'gemini-3.5-flash');
  assert.equal(resolveGeminiModel('gemini-3.6-flash'), 'gemini-3.5-flash');
  assert.equal(resolveGeminiModel(''), 'gemini-3.5-flash');
});

test('GENKI_GRAMMAR_LESSONS includes a lesson 1 to 12 curriculum map', () => {
  assert.ok(Array.isArray(GENKI_GRAMMAR_LESSONS));
  assert.ok(GENKI_GRAMMAR_LESSONS.some((lesson) => lesson.number === 1));
  assert.ok(GENKI_GRAMMAR_LESSONS.some((lesson) => lesson.number === 12));
});

test('Lesson 2 and Lesson 3 use their intended grammar scopes', () => {
  const lessonTwo = GENKI_GRAMMAR_LESSONS.find((lesson) => lesson.number === 2);
  const lessonThree = GENKI_GRAMMAR_LESSONS.find((lesson) => lesson.number === 3);

  assert.deepEqual(lessonTwo.grammar, ['の', 'も', 'か']);
  assert.deepEqual(lessonThree.grammar, ['ます', 'ません', 'を', 'に', 'で']);
});
