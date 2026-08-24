import test from 'node:test';
import assert from 'node:assert/strict';

import { getMatchingResultScore, isQuestionCorrect, summarizeResults } from './grammarScoring.js';

test('multiple choice accepts the canonical answer', () => {
  const question = {
    type: 'multiple-choice',
    correctAnswer: 'の',
    acceptedAnswers: ['の'],
  };

  assert.equal(isQuestionCorrect(question, 'の'), true);
  assert.equal(isQuestionCorrect(question, 'は'), false);
});

test('translation accepts alternate accepted answers', () => {
  const question = {
    type: 'translation',
    correctAnswer: 'これは私のかばんです',
    acceptedAnswers: ['これは私のかばんです。', 'これは私のかばんです'],
  };

  assert.equal(isQuestionCorrect(question, 'これは私のかばんです。'), true);
  assert.equal(isQuestionCorrect(question, 'これはあなたのかばんです'), false);
});

test('answers are compared with a single accepted answer value', () => {
  const question = {
    type: 'translation',
    correctAnswer: 'これは私のかばんです',
    acceptedAnswers: 'これは私の鞄です',
  };

  assert.equal(isQuestionCorrect(question, 'これは私の鞄です'), true);
  assert.equal(isQuestionCorrect(question, 'これはあなたの鞄です'), false);
});

test('romaji answers are converted to kana before checking the canonical answer', () => {
  const question = {
    type: 'translation',
    correctAnswer: 'これは私のかばんです',
    acceptedAnswers: ['これは私のかばんです'],
  };

  assert.equal(isQuestionCorrect(question, 'kore wa watashi no kaban desu'), true);
  assert.equal(isQuestionCorrect(question, 'kore wa anata no kaban desu'), false);
});

test('normalization is skipped when the canonical answer is already romaji', () => {
  const question = {
    type: 'translation',
    correctAnswer: 'kore wa watashi no kaban desu',
    acceptedAnswers: ['kore wa watashi no kaban desu'],
  };

  assert.equal(isQuestionCorrect(question, 'kore wa watashi no kaban desu'), true);
  assert.equal(isQuestionCorrect(question, 'これは私のかばんです'), false);
});

test('romaji references accept o as equivalent to wo', () => {
  const question = {
    type: 'fill-in-the-blank',
    correctAnswer: 'を',
    correctAnswerRomaji: 'wo',
    acceptedAnswers: ['を'],
  };

  assert.equal(isQuestionCorrect(question, 'o'), true);
  assert.equal(isQuestionCorrect(question, 'wo'), true);
  assert.equal(isQuestionCorrect(question, 'wa'), false);
});

test('romaji answers are checked directly against correctAnswerRomaji', () => {
  const question = {
    type: 'fill-in-the-blank',
    correctAnswer: 'は',
    correctAnswerRomaji: 'wa',
    acceptedAnswers: ['は'],
  };

  assert.equal(isQuestionCorrect(question, 'wa'), true);
  assert.equal(isQuestionCorrect(question, 'は'), true);
  assert.equal(isQuestionCorrect(question, 'ga'), false);
});

test('matching compares pair sets without order', () => {
  const question = {
    type: 'matching',
    correctPairs: [
      { left: 'は', right: 'topic marker' },
      { left: 'を', right: 'direct object marker' },
    ],
  };

  assert.equal(
    isQuestionCorrect(question, [
      { left: 'を', right: 'direct object marker' },
      { left: 'は', right: 'topic marker' },
    ]),
    true,
  );

  assert.equal(
    isQuestionCorrect(question, [
      { left: 'は', right: 'topic marker' },
      { left: 'を', right: 'wrong choice' },
    ]),
    false,
  );
});

test('matching scores pairs from the solo selection state', () => {
  const question = {
    type: 'matching',
    correctPairs: [
      { left: 'は', right: 'topic marker' },
      { left: 'を', right: 'direct object marker' },
      { left: 'で', right: 'place of action' },
      { left: 'に', right: 'destination / time target' },
    ],
  };

  const result = getMatchingResultScore(question, {
    selectedLeft: null,
    selectedRight: null,
    pairs: [
      { left: 'は', right: 'topic marker' },
      { left: 'を', right: 'wrong choice' },
    ],
  });

  assert.equal(result.correct, 1);
  assert.equal(result.total, 4);
  assert.equal(result.scorePercent, 25);
});

test('summary counts correct answers across the entire set', () => {
  const questions = [
    { type: 'multiple-choice', correctAnswer: 'の', acceptedAnswers: ['の'] },
    { type: 'translation', correctAnswer: '私は学生です', acceptedAnswers: ['私は学生です。', '私は学生です'] },
    { type: 'matching', correctPairs: [{ left: 'を', right: 'direct object marker' }] },
  ];

  const result = summarizeResults(questions, [
    'の',
    '私は学生です。',
    [{ left: 'を', right: 'direct object marker' }],
  ]);

  assert.equal(result.correctCount, 3);
  assert.equal(result.totalCount, 3);
  assert.equal(result.scorePercent, 100);
});

test('unanswered questions are counted as incorrect', () => {
  const questions = [
    { type: 'multiple-choice', correctAnswer: 'の', acceptedAnswers: ['の'] },
    { type: 'matching', correctPairs: [{ left: 'は', right: 'topic marker' }] },
  ];

  const result = summarizeResults(questions, [undefined, {}]);

  assert.equal(result.correctCount, 0);
  assert.equal(result.incorrectCount, 2);
  assert.equal(result.scorePercent, 0);
});

test('solo answer values remain positional for object answers such as matching pairs', () => {
  const questions = [
    { type: 'matching', correctPairs: [{ left: 'は', right: 'topic marker' }] },
    { type: 'translation', correctAnswer: '学生です', acceptedAnswers: ['学生です'] },
  ];

  const answers = questions.map((_, index) => [
    [{ left: 'は', right: 'topic marker' }],
    '学生です',
  ][index]);

  assert.deepEqual(answers[0], [{ left: 'は', right: 'topic marker' }]);
  assert.equal(summarizeResults(questions, answers).scorePercent, 100);
});
