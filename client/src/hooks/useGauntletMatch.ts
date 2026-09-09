import { useCallback, useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import {
  bindGauntletMatchChannel,
  type GauntletAttackType,
  type GauntletMatchCallbacks,
} from '../types/socket-events';

type AttackType = GauntletAttackType;

interface UseGauntletMatchProps {
  roomId: string;
  userId: string;
  onOpponentSync: (data: { hp: number; score: number }) => void;
  onReceiveAttack: (attackType: AttackType) => void;
  onOpponentKO: () => void;
}

export type { GauntletMatchCallbacks } from '../types/socket-events';

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
    channelRef.current = channel;
    const cleanupChannel = bindGauntletMatchChannel(channel, userId, {
      onOpponentSync: (data) => callbacksRef.current.onOpponentSync(data),
      onReceiveAttack: (attackType) => callbacksRef.current.onReceiveAttack(attackType),
      onOpponentKO: () => callbacksRef.current.onOpponentKO(),
    });
    channel.subscribe();
    return () => {
      if (channelRef.current === channel) channelRef.current = null;
      cleanupChannel();
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