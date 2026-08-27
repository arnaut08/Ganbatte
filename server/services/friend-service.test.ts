import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeFriendPresence, normalizeFriendshipPair } from './friend-service.js';

test('mergeFriendPresence keeps friends sorted with online status first', () => {
  const friends = [
    { id: 'friend-1', display_name: 'Alice' },
    { id: 'friend-2', display_name: 'Bob' },
    { id: 'friend-3', display_name: 'Charlie' },
  ];

  const result = mergeFriendPresence(friends, ['friend-2']);

  assert.deepEqual(result.map(({ id, online }) => ({ id, online })), [
    { id: 'friend-2', online: true },
    { id: 'friend-1', online: false },
    { id: 'friend-3', online: false },
  ]);
});

test('normalizeFriendshipPair canonicalizes a friendship into a single stored row', () => {
  assert.deepEqual(normalizeFriendshipPair('user-b', 'user-a'), ['user-a', 'user-b']);
  assert.deepEqual(normalizeFriendshipPair('user-a', 'user-b'), ['user-a', 'user-b']);
});
