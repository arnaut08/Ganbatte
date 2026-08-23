import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFallbackGenkiLesson,
  createGenkiLessonPrompt,
  normalizeGenkiLesson,
  parseJsonResponse,
} from './genki-lesson-service.js';

test('buildFallbackGenkiLesson returns the complete validated lesson shape', () => {
  const lesson = buildFallbackGenkiLesson(1);

  assert.equal(lesson.lessonNumber, 1);
  assert.ok(lesson.overview);
  assert.ok(lesson.objectives.length >= 2);
  assert.ok(lesson.grammarPoints.length > 0);
  assert.ok(lesson.grammarPoints.every((point) => point.examples.length > 0));
});

test('createGenkiLessonPrompt limits generation to the selected lesson scope', () => {
  const prompt = createGenkiLessonPrompt(5);

  assert.match(prompt, /lesson 5/i);
  assert.match(prompt, /strictly following Genki Volume 1|Genki Volume 1/i);
  assert.match(prompt, /valid JSON only/i);
  assert.match(prompt, /JLPT N5/i);
  assert.match(prompt, /furigana/i);
});

test('parseJsonResponse extracts JSON from Gemini markdown or surrounding text', () => {
  assert.deepEqual(parseJsonResponse('Here are your notes:\n```json\n{"lessonNumber": 11}\n```'), {
    lessonNumber: 11,
  });
});

test('normalizeGenkiLesson rejects malformed or mismatched Gemini output', () => {
  assert.throws(
    () => normalizeGenkiLesson({ lessonNumber: 2 }, 1),
    /Invalid Genki lesson 1 at title/,
  );

  const valid = buildFallbackGenkiLesson(1);
  assert.throws(
    () => normalizeGenkiLesson({ ...valid, lessonNumber: 2 }, 1),
    /mismatch/,
  );
});

test('normalizeGenkiLesson accepts common Gemini naming variants', () => {
  const lesson = buildFallbackGenkiLesson(1);
  const normalized = normalizeGenkiLesson({
    ...lesson,
    objectives: undefined,
    learningObjectives: lesson.objectives,
    grammarPoints: undefined,
    grammar_points: lesson.grammarPoints,
    commonMistakes: undefined,
    common_mistakes: lesson.commonMistakes,
    reviewChecklist: undefined,
    review_checklist: lesson.reviewChecklist,
  }, 1);

  assert.deepEqual(normalized.objectives, lesson.objectives);
  assert.equal(normalized.grammarPoints.length, lesson.grammarPoints.length);
});

test('normalizeGenkiLesson converts structured bullet items to display text', () => {
  const lesson = buildFallbackGenkiLesson(1);
  const normalized = normalizeGenkiLesson({
    ...lesson,
    commonMistakes: [{ mistake: 'Using the wrong particle.', correction: 'Check its sentence role.' }],
    objectives: [{ objective: lesson.objectives[0] }, { text: lesson.objectives[1] }],
    reviewChecklist: [{ item: lesson.reviewChecklist[0] }, { description: lesson.reviewChecklist[1] }],
  }, 1);

  assert.equal(normalized.commonMistakes[0], 'Using the wrong particle. Check its sentence role.');
  assert.deepEqual(normalized.objectives.slice(0, 2), lesson.objectives.slice(0, 2));
  assert.deepEqual(normalized.reviewChecklist, lesson.reviewChecklist.slice(0, 2));
});

test('generated lesson contract requests and provides thorough study material', () => {
  const prompt = createGenkiLessonPrompt(1);
  const lesson = buildFallbackGenkiLesson(1);

  assert.match(prompt, /self-contained study notes/i);
  assert.match(prompt, /usage notes/i);
  assert.match(prompt, /guided practice/i);
  assert.ok(lesson.grammarPoints.every((point) => point.usageNotes.length >= 2));
  assert.ok(lesson.grammarPoints.every((point) => point.examples.length >= 3));
  assert.ok(lesson.guidedPractice.length >= 3);
});

test('normalizeGenkiLesson accepts common example field aliases', () => {
  const lesson = buildFallbackGenkiLesson(1);
  const point = lesson.grammarPoints[0];
  const normalized = normalizeGenkiLesson({
    ...lesson,
    grammarPoints: [{
      ...point,
      examples: undefined,
      exampleSentences: [{
        japaneseSentence: point.examples[0].japanese,
        romanization: point.examples[0].romaji,
        translation: point.examples[0].english,
      }],
    }, ...lesson.grammarPoints.slice(1)],
  }, 1);

  assert.deepEqual(normalized.grammarPoints[0].examples[0], point.examples[0]);
});

test('normalizeGenkiLesson converts structured formation steps to display text', () => {
  const lesson = buildFallbackGenkiLesson(6);
  const normalized = normalizeGenkiLesson({
    ...lesson,
    grammarPoints: lesson.grammarPoints.map((point, index) => index === 0
      ? { ...point, formation: ['Choose the giver', 'Use the correct verb form', 'Add the object'] }
      : point),
  }, 6);

  assert.equal(
    normalized.grammarPoints[0].formation,
    'Choose the giver -> Use the correct verb form -> Add the object',
  );
});

test('normalizeGenkiLesson accepts a detailed formation explanation', () => {
  const lesson = buildFallbackGenkiLesson(8);
  const formation = 'Use the te-form of the verb, then add the target ending. '.repeat(12).trim();
  const normalized = normalizeGenkiLesson({
    ...lesson,
    grammarPoints: lesson.grammarPoints.map((point, index) => index === 0
      ? { ...point, formation }
      : point),
  }, 8);

  assert.equal(normalized.grammarPoints[0].formation, formation);
});