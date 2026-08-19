import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGrammarAssessment,
  GENKI_GRAMMAR_LESSONS,
  resolveGeminiModel,
} from './genki-grammar-service.js';

test('buildGrammarAssessment respects the selected max lesson and returns valid item types', () => {
  const assessment = buildGrammarAssessment({ maxLesson: 2, count: 6 });

  assert.equal(assessment.length, 6);
  assert.ok(assessment.every((item) => item.lesson <= 2));
  assert.ok(assessment.every((item) => ['multiple-choice', 'fill-in-the-blank', 'matching', 'translation', 'comprehension'].includes(item.type)));
  assert.ok(assessment.every((item) => item.prompt && item.explanation));
});

test('resolveGeminiModel falls back for unsupported model names', () => {
  assert.equal(resolveGeminiModel('gemini-2.5-flash-lite'), 'gemini-3.6-flash');
  assert.equal(resolveGeminiModel('gemini-3.6-flash'), 'gemini-3.6-flash');
  assert.equal(resolveGeminiModel(''), 'gemini-3.6-flash');
});

test('GENKI_GRAMMAR_LESSONS includes a lesson 1 to 12 curriculum map', () => {
  assert.ok(Array.isArray(GENKI_GRAMMAR_LESSONS));
  assert.ok(GENKI_GRAMMAR_LESSONS.some((lesson) => lesson.number === 1));
  assert.ok(GENKI_GRAMMAR_LESSONS.some((lesson) => lesson.number === 12));
});
