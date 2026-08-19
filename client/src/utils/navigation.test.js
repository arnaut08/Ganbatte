import test from 'node:test';
import assert from 'node:assert/strict';

import {
  pushScreenHistory,
  getPreviousStatus,
  getBackStatus,
} from './navigation.js';

test('pushScreenHistory tracks the last non-duplicate screen before moving forward', () => {
  assert.deepEqual(pushScreenHistory(['selector'], 'selector', 'friends'), ['selector', 'friends']);
  assert.deepEqual(pushScreenHistory(['selector', 'lobby'], 'lobby', 'friends'), ['selector', 'lobby', 'friends']);
  assert.deepEqual(pushScreenHistory(['selector', 'friends'], 'friends', 'friends'), ['selector', 'friends']);
});

test('pushScreenHistory preserves the prior room screen when navigating to friends', () => {
  assert.deepEqual(pushScreenHistory(['selector', 'lobby'], 'lobby', 'friends'), ['selector', 'lobby', 'friends']);
  assert.deepEqual(pushScreenHistory(['selector'], 'selector', 'lobby'), ['selector', 'lobby']);
});

test('getPreviousStatus returns the screen before the current one, or selector when missing', () => {
  assert.equal(getPreviousStatus(['selector', 'lobby', 'friends']), 'lobby');
  assert.equal(getPreviousStatus(['selector']), 'selector');
  assert.equal(getPreviousStatus([]), 'selector');
});

test('getBackStatus uses the previous screen as the back target without forcing home', () => {
  assert.equal(getBackStatus(['selector', 'lobby', 'friends']), 'lobby');
  assert.equal(getBackStatus(['selector', 'friends']), 'selector');
  assert.equal(getBackStatus([]), 'selector');
});
