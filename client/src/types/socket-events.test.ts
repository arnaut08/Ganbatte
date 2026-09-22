import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  bindRoomSocketEvent,
  createRejoinGate,
  normalizeRoomSocketEvent,
} from './socket-events';

describe('room socket event boundary', () => {
  it('normalizes room players and rejects malformed rooms', () => {
    const payload = normalizeRoomSocketEvent('player-joined', {
      room: {
        code: 'ABCD',
        players: [{ name: 'Ada', hintsUsed: [1, 'bad', 2] }],
      },
    });

    assert.deepEqual(payload?.room?.players[0].hintsUsed, [1, 2]);
    assert.equal(normalizeRoomSocketEvent('player-joined', { room: { players: [{}] } }), null);
    assert.equal(normalizeRoomSocketEvent('player-joined', 'not-an-object'), null);
  });

  it('removes the exact normalized listener that it registers', () => {
    const listeners = new Map<string, (value: unknown) => void>();
    const offCalls: Array<[string, (value: unknown) => void]> = [];
    const off = (event: string, listener: (value: unknown) => void) => {
      offCalls.push([event, listener]);
      if (listeners.get(event) === listener) listeners.delete(event);
    };
    const socket = {
      on: (event: string, listener: (value: unknown) => void) => {
        listeners.set(event, listener);
        return socket;
      },
      off,
    } as never;
    let callCount = 0;
    const handler = () => { callCount += 1; };
    const cleanup = bindRoomSocketEvent(socket, 'room-created', handler);

    listeners.get('room-created')?.('ROOM1');
    listeners.get('room-created')?.({ invalid: true });
    cleanup();

    assert.equal(callCount, 1);
    assert.equal(offCalls.length, 1);
    assert.equal(listeners.size, 0);
  });
});

describe('room rejoin gate', () => {
  it('deduplicates restoration, resets on disconnect, and permits forced return', () => {
    const gate = createRejoinGate();
    const socket = {};

    assert.equal(gate.claim(socket, 'room:user'), true);
    assert.equal(gate.claim(socket, 'room:user'), false);
    gate.resolve(true);
    assert.equal(gate.claim(socket, 'room:user'), false);
    gate.reset();
    assert.equal(gate.claim(socket, 'room:user'), true);
    assert.equal(gate.claim(socket, 'room:user', true), true);
  });

  it('allows a retry after a failed rejoin acknowledgement', () => {
    const gate = createRejoinGate();
    const socket = {};

    assert.equal(gate.claim(socket, 'room:user'), true);
    gate.resolve(false);
    assert.equal(gate.claim(socket, 'room:user'), true);
  });
});
