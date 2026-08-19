import test from 'node:test';
import assert from 'node:assert/strict';

import { mergePlayerAnswers } from './grammarRoomSync.js';

test('preserves locally typed answers when the room snapshot is temporarily empty', () => {
  const previous = { 0: 'watashi', 1: 'kore' };

  const next = mergePlayerAnswers(previous, []);

  assert.deepEqual(next, previous);
});

test('merges room answers without clearing newer local selections', () => {
  const previous = { 0: 'watashi', 1: 'kore' };
  const roomAnswers = ['watashi', 'desu', 'arimasu'];

  const next = mergePlayerAnswers(previous, roomAnswers);

  assert.deepEqual(next, { 0: 'watashi', 1: 'desu', 2: 'arimasu' });
});
