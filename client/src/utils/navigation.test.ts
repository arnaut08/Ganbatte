import test from 'node:test';
import assert from 'node:assert/strict';

import { getBackDestination } from './navigation';

test('getBackDestination returns selector with home tab from selector screen', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'selector', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'home' },
  );
});

test('getBackDestination returns selector with learning tab from kana screens', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'kana-intro', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'kana-study', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
});

test('getBackDestination returns kana-intro from kana-filter', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'kana-filter', selectorScreen: 'home' }),
    { nextStatus: 'kana-intro' },
  );
});

test('getBackDestination returns selector with learning tab from kanji screens', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'kanji-intro', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'kanji-study', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
});

test('getBackDestination returns selector with learning tab from vocab screens', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'vocab-intro', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'vocab-study', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
});

test('getBackDestination returns grammar-study from grammar-practice', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'grammar-practice', selectorScreen: 'home' }),
    { nextStatus: 'grammar-study' },
  );
});

test('getBackDestination returns selector with learning tab from grammar screens', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'grammar-intro', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'grammar-study', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
});

test('getBackDestination returns selector from overlay screens', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'friends', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'home' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'passport', selectorScreen: 'learning' }),
    { nextStatus: 'selector', nextSelectorScreen: 'learning' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'history', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'home' },
  );
});

test('getBackDestination returns selector with practice tab from lobby', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'lobby', selectorScreen: 'home' }),
    { nextStatus: 'selector', nextSelectorScreen: 'practice' },
  );
});

test('getBackDestination returns lobby from room flow screens', () => {
  assert.deepEqual(
    getBackDestination({ currentStatus: 'assessment-preparing', selectorScreen: 'home' }),
    { nextStatus: 'lobby' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'assessment', selectorScreen: 'home' }),
    { nextStatus: 'lobby' },
  );
  assert.deepEqual(
    getBackDestination({ currentStatus: 'results', selectorScreen: 'home' }),
    { nextStatus: 'lobby' },
  );
});

test('getBackDestination redirects to assessment when in active room and not on assessment', () => {
  assert.deepEqual(
    getBackDestination({
      currentStatus: 'friends',
      selectorScreen: 'home',
      activeRoomCode: 'ROOM123',
      roomStatus: 'active',
    }),
    { nextStatus: 'assessment' },
  );
  assert.deepEqual(
    getBackDestination({
      currentStatus: 'kana-study',
      selectorScreen: 'learning',
      activeRoomCode: 'ROOM123',
      roomStatus: 'active',
    }),
    { nextStatus: 'assessment' },
  );
});

test('getBackDestination redirects to lobby when in preparing room and not on lobby', () => {
  assert.deepEqual(
    getBackDestination({
      currentStatus: 'passport',
      selectorScreen: 'home',
      activeRoomCode: 'ROOM123',
      roomStatus: 'lobby',
    }),
    { nextStatus: 'lobby' },
  );
  assert.deepEqual(
    getBackDestination({
      currentStatus: 'history',
      selectorScreen: 'home',
      activeRoomCode: 'ROOM123',
      roomStatus: 'preparing',
    }),
    { nextStatus: 'lobby' },
  );
});

test('getBackDestination does not redirect when room is completed', () => {
  assert.deepEqual(
    getBackDestination({
      currentStatus: 'friends',
      selectorScreen: 'home',
      activeRoomCode: 'ROOM123',
      roomStatus: 'completed',
    }),
    { nextStatus: 'selector', nextSelectorScreen: 'home' },
  );
});

test('getBackDestination does not redirect when already on assessment in active room', () => {
  assert.deepEqual(
    getBackDestination({
      currentStatus: 'assessment',
      selectorScreen: 'home',
      activeRoomCode: 'ROOM123',
      roomStatus: 'active',
    }),
    { nextStatus: 'lobby' },
  );
});

test('getBackDestination does not redirect when already on lobby in lobby room', () => {
  assert.deepEqual(
    getBackDestination({
      currentStatus: 'lobby',
      selectorScreen: 'home',
      activeRoomCode: 'ROOM123',
      roomStatus: 'lobby',
    }),
    { nextStatus: 'selector', nextSelectorScreen: 'practice' },
  );
});
