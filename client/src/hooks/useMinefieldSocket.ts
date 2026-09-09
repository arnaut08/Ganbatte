import { useCallback, useEffect, useRef, useState } from 'react';
import type { MinefieldState } from '../types/room';
import { sound } from '../utils/sound';
import {
  bindRoomSocketEvent,
  type RoomSocketEvent,
  type RoomSocket,
} from '../types/socket-events';

export type MinefieldMatchResult = RoomSocketEvent<'minefield-match-completed'>;

function getMinefieldBoardKey(minefield: MinefieldState): string {
  return `${minefield.currentPrompt}:${minefield.tiles.map((tile) => tile.id).sort().join(',')}`;
}

export function useMinefieldSocket(
  socket: RoomSocket | null,
  roomCode?: string,
  currentUserId?: string,
  isHost?: boolean,
  initialMinefield?: MinefieldState,
) {
  const [localMinefield, setLocalMinefield] = useState<MinefieldState | null>(initialMinefield ?? null);
  const [matchResult, setMatchResult] = useState<MinefieldMatchResult | null>(null);
  const lastSyncedBoardKeyRef = useRef<string | null>(initialMinefield ? getMinefieldBoardKey(initialMinefield) : null);

  useEffect(() => {
    if (initialMinefield) {
      lastSyncedBoardKeyRef.current = getMinefieldBoardKey(initialMinefield);
      setLocalMinefield(initialMinefield);
    }
  }, [initialMinefield]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'minefield-sync', (payload) => {
      const minefield = payload.room?.minefield;
      if (!minefield) return;

      const boardKey = getMinefieldBoardKey(minefield);
      if (lastSyncedBoardKeyRef.current !== boardKey) {
        sound.playSync();
        lastSyncedBoardKeyRef.current = boardKey;
      }
      setLocalMinefield(minefield);
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'minefield-tile-resolved', (payload) => {
      if (payload.success) sound.playSuccess();
      else sound.playExplosion();

      setLocalMinefield((previous) => {
        if (!previous) return previous;

        const isCurrentUserOwner = payload.ownerId === currentUserId || payload.ownerId === socket.id;
        const status = payload.success
          ? isCurrentUserOwner
            ? isHost ? 'claimed-host' : 'claimed-guest'
            : isHost ? 'claimed-guest' : 'claimed-host'
          : isCurrentUserOwner ? 'exploded' : undefined;

        return {
          ...previous,
          hostScore: payload.hostScore,
          guestScore: payload.guestScore,
          tiles: previous.tiles.map((tile) => (
            tile.id === payload.tileId
              ? {
                ...tile,
                ...(status ? { status } : {}),
                claimedBy: payload.success ? payload.ownerId : tile.claimedBy,
              }
              : tile
          )),
        };
      });
    });
  }, [currentUserId, isHost, socket]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'minefield-match-completed', (payload) => {
      if (payload.room?.minefield) setLocalMinefield(payload.room.minefield);
      setMatchResult(payload);
    });
  }, [socket]);

  const claimTile = useCallback((tileId: string) => {
    if (!socket || !roomCode) return;

    setLocalMinefield((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        tiles: previous.tiles.map((tile) => (
          tile.id === tileId && tile.status === 'idle'
            ? { ...tile, status: 'verifying' }
            : tile
        )),
      };
    });
    socket.emit('minefield-claim-attempt', roomCode, tileId);
  }, [roomCode, socket]);

  return { localMinefield, claimTile, matchResult };
}

export default useMinefieldSocket;
