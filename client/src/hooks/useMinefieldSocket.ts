import { useCallback, useEffect, useState } from 'react';
import type { MinefieldState } from '../types/room';
import {
  bindRoomSocketEvent,
  type RoomSocket,
} from '../types/socket-events';

export function useMinefieldSocket(
  socket: RoomSocket | null,
  roomCode?: string,
  currentUserId?: string,
  isHost?: boolean,
  initialMinefield?: MinefieldState,
) {
  const [localMinefield, setLocalMinefield] = useState<MinefieldState | null>(initialMinefield ?? null);

  useEffect(() => {
    if (initialMinefield) setLocalMinefield(initialMinefield);
  }, [initialMinefield]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'minefield-sync', (payload) => {
      const minefield = payload.room?.minefield;
      if (minefield) setLocalMinefield(minefield);
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return undefined;

    return bindRoomSocketEvent(socket, 'minefield-tile-resolved', (payload) => {
      setLocalMinefield((previous) => {
        if (!previous) return previous;

        const isCurrentUserOwner = payload.ownerId === currentUserId || payload.ownerId === socket.id;
        const status = payload.success
          ? isCurrentUserOwner
            ? isHost ? 'claimed-host' : 'claimed-guest'
            : isHost ? 'claimed-guest' : 'claimed-host'
          : 'exploded';

        return {
          ...previous,
          tiles: previous.tiles.map((tile) => (
            tile.id === payload.tileId
              ? { ...tile, status, claimedBy: payload.success ? payload.ownerId : tile.claimedBy }
              : tile
          )),
        };
      });
    });
  }, [currentUserId, isHost, socket]);

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

  return { localMinefield, claimTile };
}

export default useMinefieldSocket;
