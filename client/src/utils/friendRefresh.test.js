import test from 'node:test';
import assert from 'node:assert/strict';

import { createFriendRefreshGuard } from './friendRefresh.js';

test('friend refresh guard suppresses duplicate refreshes for the same user across reconnects', () => {
  const shouldRefresh = createFriendRefreshGuard();

  assert.equal(shouldRefresh('user-1', 'socket-1', 'friends'), true);
  assert.equal(shouldRefresh('user-1', 'socket-2', 'friends'), false);
  assert.equal(shouldRefresh('user-1', 'socket-3', 'requests'), true);
  assert.equal(shouldRefresh('user-2', 'socket-2', 'friends'), true);
});

test('friend refresh guard resets when user becomes null', () => {
  const shouldRefresh = createFriendRefreshGuard();

  assert.equal(shouldRefresh('user-1', 'socket-1', 'friends'), true);
  assert.equal(shouldRefresh(null, 'socket-1', 'friends'), true);
  assert.equal(shouldRefresh(null, 'socket-1', 'friends'), false);
  assert.equal(shouldRefresh('user-1', 'socket-1', 'friends'), true);
});
