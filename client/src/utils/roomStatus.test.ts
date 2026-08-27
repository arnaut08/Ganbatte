import test from 'node:test';
import assert from 'node:assert/strict';

import { canStartAssessment, getPlayerPresenceStatus } from './roomStatus';

test('room presence distinguishes lobby, away, and disconnected states', () => {
  assert.equal(getPlayerPresenceStatus({ connected: true, presence: 'in_lobby' }), 'in_lobby');
  assert.equal(getPlayerPresenceStatus({ connected: true, presence: 'away' }), 'away');
  assert.equal(getPlayerPresenceStatus({ connected: false, presence: 'in_lobby' }), 'disconnected');
  assert.equal(getPlayerPresenceStatus({ status: 'ready' }), 'ready');
});

test('host can only start when both players are in the lobby and ready to start', () => {
  assert.equal(canStartAssessment([
    { connected: true, status: 'in_lobby' },
    { connected: true, status: 'in_lobby' },
  ]), true);

  assert.equal(canStartAssessment([
    { connected: true, status: 'in_lobby' },
    { connected: true, status: 'away' },
  ]), false);

  assert.equal(canStartAssessment([
    { connected: true, status: 'in_lobby' },
    { connected: false, status: 'in_lobby' },
  ]), false);
});
