import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSrsUpdate } from './vocab-progress-service.js';

const NOW = new Date('2026-08-29T00:00:00.000Z');

test('successful first review starts a one-day interval', () => {
  const update = calculateSrsUpdate(null, 3, NOW);

  assert.equal(update.srs_stage, 1);
  assert.equal(update.repetitions, 1);
  assert.equal(update.interval_days, 1);
  assert.equal(update.next_review_at, '2026-08-30T00:00:00.000Z');
});

test('successful second review uses the standard six-day interval', () => {
  const update = calculateSrsUpdate({ repetitions: 1, interval_days: 1, ease_factor: 2.5 }, 4, NOW);

  assert.equal(update.srs_stage, 2);
  assert.equal(update.repetitions, 2);
  assert.equal(update.interval_days, 6);
  assert.equal(update.next_review_at, '2026-09-04T00:00:00.000Z');
});

test('failed review resets repetitions and schedules a one-day retry', () => {
  const update = calculateSrsUpdate({ repetitions: 4, interval_days: 20, ease_factor: 2.5 }, 1, NOW);

  assert.equal(update.srs_stage, 0);
  assert.equal(update.repetitions, 0);
  assert.equal(update.interval_days, 1);
  assert.equal(update.next_review_at, '2026-08-30T00:00:00.000Z');
});

test('ease factor never falls below 1.3', () => {
  const update = calculateSrsUpdate({ repetitions: 4, interval_days: 20, ease_factor: 1.3 }, 1, NOW);

  assert.equal(update.ease_factor, 1.3);
});