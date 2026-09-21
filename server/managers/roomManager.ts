import type { SupabaseClient } from '@supabase/supabase-js';
import { generateMinefieldBoard } from '../services/minefieldService.js';
import { generateDynamicTugOfWarDeck, tugOfWarQuestionToState } from '../services/tugOfWarService.js';
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

export async function startTugOfWarRound(
  roomCode: string,
  supabaseClient: SupabaseClient,
): Promise<Room | undefined> {
  const room = roomState.rooms.get(roomCode);
  if (!room) return undefined;

  if (!room.tugOfWarDeck) {
    room.tugOfWarDeck = await generateDynamicTugOfWarDeck(room.grammarSettings?.maxLesson ?? 3);
    room.tugOfWarQuestionIndex = 0;
  } else {
    room.tugOfWarQuestionIndex = (room.tugOfWarQuestionIndex ?? 0) + 1;
  }

  const question = room.tugOfWarDeck[room.tugOfWarQuestionIndex ?? 0];
  if (!question) throw new Error('Tug of War question deck is exhausted.');
  room.tugOfWar = tugOfWarQuestionToState(question, room.tugOfWar?.momentum ?? 0);
  roomState.rooms.set(roomCode, room);
  socketServer?.to(roomCode).emit('tug-sync', { room });
  return room;
}