import { useCallback, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

type AttackType = 'SPEED_SURGE';

interface UseGauntletMatchProps {
  roomId: string;
  userId: string;
  onOpponentSync: (data: { hp: number; score: number }) => void;
  onReceiveAttack: (attackType: AttackType) => void;
  onOpponentKO: () => void;
}

export function useGauntletMatch({
  roomId,
  userId,
  onOpponentSync,
  onReceiveAttack,
  onOpponentKO,
}: UseGauntletMatchProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef({ onOpponentSync, onReceiveAttack, onOpponentKO });
  callbacksRef.current = { onOpponentSync, onReceiveAttack, onOpponentKO };

  useEffect(() => {
    if (!supabase || !roomId || !userId) return undefined;

    const channel = supabase.channel(`gauntlet:${roomId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on('broadcast', { event: 'player_sync' }, ({ payload }) => {
        if (payload?.userId !== userId) callbacksRef.current.onOpponentSync(payload);
      })
      .on('broadcast', { event: 'player_attack' }, ({ payload }) => {
        if (payload?.targetUserId === userId) callbacksRef.current.onReceiveAttack(payload.attackType);
      })
      .on('broadcast', { event: 'player_ko' }, ({ payload }) => {
        if (payload?.userId !== userId) callbacksRef.current.onOpponentKO();
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void channel.unsubscribe();
    };
  }, [roomId, userId]);

  const sendSync = useCallback((hp: number, score: number) => {
    void channelRef.current?.send({
      type: 'broadcast',
      event: 'player_sync',
      payload: { userId, hp, score },
    });
  }, [userId]);

  const sendAttack = useCallback((targetUserId: string, attackType: AttackType) => {
    void channelRef.current?.send({
      type: 'broadcast',
      event: 'player_attack',
      payload: { userId, targetUserId, attackType },
    });
  }, [userId]);

  const notifyKO = useCallback(() => {
    void channelRef.current?.send({
      type: 'broadcast',
      event: 'player_ko',
      payload: { userId },
    });
  }, [userId]);

  return { sendSync, sendAttack, notifyKO };
}