import type { SupabaseClient } from '@supabase/supabase-js';
import { generateMinefieldBoard } from '../services/minefieldService.js';
import { roomState, type Room, type SocketServer } from '../utils/socket-room-utils.js';

let socketServer: SocketServer | null = null;

export function configureRoomManager(io: SocketServer): void {
  socketServer = io;
}

export async function startMinefieldRound(
  roomCode: string,
  supabaseClient: SupabaseClient,
): Promise<Room | undefined> {
  const room = roomState.rooms.get(roomCode);
  if (!room) return undefined;

  const previousMinefield = room.minefield;
  const nextRoundNumber = (previousMinefield?.roundNumber ?? 0) + 1;
  const board = await generateMinefieldBoard(
    supabaseClient,
    undefined,
    room.selectedGroups,
    nextRoundNumber,
    previousMinefield?.usedPromptMeanings ?? [],
  );
  room.minefield = {
    ...board,
    hostScore: previousMinefield?.hostScore ?? 0,
    guestScore: previousMinefield?.guestScore ?? 0,
  };
  roomState.rooms.set(roomCode, room);
  socketServer?.to(roomCode).emit('minefield-sync', { room });
  return room;
}