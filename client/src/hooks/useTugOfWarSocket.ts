import { useCallback, useEffect, useRef, useState } from 'react';
import type { TugOfWarState } from '../types/room';
import { sound } from '../utils/sound';
import {
  bindRoomSocketEvent,
  type RoomSocket,
  type RoomSocketEvent,
} from '../types/socket-events';

export type TugOfWarMatchResult = RoomSocketEvent<'tug-match-completed'>;

export function useTugOfWarSocket(
  socket: RoomSocket | null,
  roomCode: string,
  currentUserId: string,
  isHost: boolean,
  initialTugOfWar?: TugOfWarState,
) {
  const [localTugOfWar, setLocalTugOfWar] = useState<TugOfWarState | null>(initialTugOfWar ?? null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [matchResult, setMatchResult] = useState<TugOfWarMatchResult | null>(null);
  const previousMomentumRef = useRef<number | null>(initialTugOfWar?.momentum ?? null);
  const localLockoutUntilRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialTugOfWar) return;
    previousMomentumRef.current = initialTugOfWar.momentum;
    const lockoutUntil = isHost ? initialTugOfWar.hostLockoutUntil : initialTugOfWar.guestLockoutUntil;
    localLockoutUntilRef.current = lockoutUntil;
    setIsLockedOut(Boolean(lockoutUntil && Date.now() < lockoutUntil));
    setLocalTugOfWar(initialTugOfWar);
  }, [initialTugOfWar, isHost]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'tug-sync', (payload) => {
      const nextState = payload.room?.tugOfWar;
      if (!nextState) return;

      const previousMomentum = previousMomentumRef.current;
      if (previousMomentum !== null) {
        const delta = nextState.momentum - previousMomentum;
        if ((isHost && delta < 0) || (!isHost && delta > 0)) sound.playSuccess();
      }
      sound.playSync();
      previousMomentumRef.current = nextState.momentum;
      const lockoutUntil = isHost ? nextState.hostLockoutUntil : nextState.guestLockoutUntil;
      localLockoutUntilRef.current = lockoutUntil;
      setIsLockedOut(Boolean(lockoutUntil && Date.now() < lockoutUntil));
      setLocalTugOfWar(nextState);
    });
  }, [isHost, socket]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'tug-penalty-applied', ({ lockoutUntil }) => {
      localLockoutUntilRef.current = lockoutUntil;
      setIsLockedOut(Date.now() < lockoutUntil);
      sound.playExplosion();
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'tug-match-completed', (payload) => {
      const isWinner = payload.winnerSocketId === socket.id
        || (Boolean(payload.winnerUserId) && payload.winnerUserId === currentUserId);
      if (isWinner) sound.playVictory();
      else sound.playDefeat();
      if (payload.room?.tugOfWar) setLocalTugOfWar(payload.room.tugOfWar);
      setMatchResult(payload);
    });
  }, [currentUserId, socket]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const lockoutUntil = localLockoutUntilRef.current;
      setIsLockedOut(Boolean(lockoutUntil && Date.now() < lockoutUntil));
    }, 50);
    return () => window.clearInterval(interval);
  }, []);

  const submitAnswer = useCallback((option: string) => {
    if (!socket || !roomCode || isLockedOut || matchResult) return;
    socket.emit('tug-claim-attempt', roomCode, option);
  }, [isLockedOut, matchResult, roomCode, socket]);

  return { localTugOfWar, isLockedOut, submitAnswer, matchResult };
}

export default useTugOfWarSocket;
