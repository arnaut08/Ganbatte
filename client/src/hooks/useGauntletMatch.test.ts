import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { bindGauntletMatchChannel } from '../types/socket-events';

describe('gauntlet realtime channel', () => {
  it('filters malformed or self broadcasts and unsubscribes the channel', () => {
    const listeners = new Map<string, (event: { payload: unknown }) => void>();
    let unsubscribeCount = 0;
    const unsubscribe = async () => { unsubscribeCount += 1; return 'ok'; };
    const channel = {
      on: (_type: string, filter: { event: string }, listener: (event: { payload: unknown }) => void) => {
        listeners.set(filter.event, listener);
        return channel;
      },
      unsubscribe,
    } as unknown as RealtimeChannel;
    const syncPayloads: Array<{ userId: string; hp: number; score: number }> = [];
    const attackTypes: string[] = [];
    let opponentKOCount = 0;

    const cleanup = bindGauntletMatchChannel(channel, 'local-user', {
      onOpponentSync: (payload) => syncPayloads.push(payload),
      onReceiveAttack: (attackType) => attackTypes.push(attackType),
      onOpponentKO: () => { opponentKOCount += 1; },
    });

    listeners.get('player_sync')?.({ payload: { userId: 'local-user', hp: 2, score: 10 } });
    listeners.get('player_sync')?.({ payload: { userId: 'remote-user', hp: 2, score: 10 } });
    listeners.get('player_attack')?.({ payload: { userId: 'remote-user', targetUserId: 'local-user', attackType: 'INVALID' } });
    listeners.get('player_attack')?.({ payload: { userId: 'remote-user', targetUserId: 'local-user', attackType: 'SPEED_SURGE' } });
    listeners.get('player_ko')?.({ payload: { userId: 'remote-user' } });
    cleanup();

    assert.deepEqual(syncPayloads, [{ userId: 'remote-user', hp: 2, score: 10 }]);
    assert.deepEqual(attackTypes, ['SPEED_SURGE']);
    assert.equal(opponentKOCount, 1);
    assert.equal(unsubscribeCount, 1);
  });
});
