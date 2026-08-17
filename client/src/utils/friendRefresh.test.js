import test from 'node:test';
import assert from 'node:assert/strict';

import { createFriendRefreshGuard } from './friendRefresh.js';

test('friend refresh guard suppresses duplicate refreshes for the same user and socket', () => {
  const shouldRefresh = createFriendRefreshGuard();

  assert.equal(shouldRefresh('user-1', 'socket-1'), true);
  assert.equal(shouldRefresh('user-1', 'socket-1'), false);
  assert.equal(shouldRefresh('user-1', 'socket-2'), true);
  assert.equal(shouldRefresh('user-2', 'socket-2'), true);
});

test('friend refresh guard resets when user becomes null', () => {
  const shouldRefresh = createFriendRefreshGuard();

  assert.equal(shouldRefresh('user-1', 'socket-1'), true);
  assert.equal(shouldRefresh(null, 'socket-1'), true);
  assert.equal(shouldRefresh(null, 'socket-1'), false);
  assert.equal(shouldRefresh('user-1', 'socket-1'), true);
});
