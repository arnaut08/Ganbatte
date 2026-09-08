import test from 'node:test';
import assert from 'node:assert/strict';

import { getGrammarResultFeedback } from './grammarFeedback';

test('a perfect score reports mastery without needing lesson history', () => {
  const feedback = getGrammarResultFeedback(100, false);

  assert.equal(feedback.kind, 'mastered');
  assert.equal(feedback.message, 'Mastered (Perfect Score)!');
});

test('a pass that already completed the consecutive-day streak reports mastery', () => {
  const feedback = getGrammarResultFeedback(85, true);

  assert.equal(feedback.kind, 'mastered');
  assert.equal(feedback.message, 'Mastered (Consecutive-Day Passes)!');
});

test('a first pass asks the learner to pass again tomorrow for mastery', () => {
  const feedback = getGrammarResultFeedback(85, false);

  assert.equal(feedback.kind, 'passed');
  assert.equal(feedback.message, 'Passed (>=80%)! Pass again tomorrow to achieve mastery.');
});

test('a failed quiz shows the standard retry prompt', () => {
  const feedback = getGrammarResultFeedback(75, false);

  assert.equal(feedback.kind, 'retry');
  assert.equal(feedback.message, 'Below the 80% pass mark. Review the lesson and try again.');
});

test('the pass mark boundary treats exactly 80% as passed and 79% as a retry', () => {
  assert.equal(getGrammarResultFeedback(80, false).kind, 'passed');
  assert.equal(getGrammarResultFeedback(79, false).kind, 'retry');
});