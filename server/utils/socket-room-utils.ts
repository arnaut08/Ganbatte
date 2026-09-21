import type { PracticeCard } from '../services/card-service.js';
import type { MinefieldState } from '../services/minefieldService.js';
import type { TugOfWarQuestion, TugOfWarState } from '../services/tugOfWarService.js';

export type RoomCard = PracticeCard;

export interface RoomPlayer { [key: string]: unknown; name: string; id?: string; userId?: string; user_id?: string; answers: unknown[]; hintsUsed: number[]; ready?: boolean; connected?: boolean; status?: string; presence?: string; disconnectedAt?: number; sessionKey?: string }

export interface Room { [key: string]: unknown; players: RoomPlayer[]; cards: RoomCard[]; currentCardIndex: number; status: string; leftPlayers: RoomPlayer[]; deckType?: string; selectedGroups?: string[]; grammarSettings?: { maxLesson?: number; count?: number } | null; questions?: unknown[]; minefield?: MinefieldState; tugOfWar?: TugOfWarState; tugOfWarDeck?: TugOfWarQuestion[]; tugOfWarQuestionIndex?: number }

export interface SocketServer { to: (roomCode: string) => { emit: (event: string, payload: unknown) => void } }

export const roomState = {
  rooms: new Map<string, Room>(),
  roomCleanupTimers: new Map<string, ReturnType<typeof setTimeout>>(),
  DISCONNECT_GRACE_PERIOD_MS: 5 * 60 * 1000,
};

export function buildAssessmentResults(room: Room): Array<{ name: string; userId: string | null; answers: unknown[]; hintsUsed: number[] }> {
  return room.players.map((player) => ({
    name: player.name,
    userId: player.userId ?? player.user_id ?? null,
    answers: Array.isArray(player.answers) ? player.answers : [],
    hintsUsed: Array.isArray(player.hintsUsed) ? player.hintsUsed : [],
  }));
}

export function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** @param {SocketServer} io @param {string} roomCode */
export function advanceRoomIfReady(io: SocketServer, roomCode: string): void {
  const room = roomState.rooms.get(roomCode);
  if (!room) return;

  const allReady = room.players.length > 0 && room.players.every((player) => player.ready === true);
  const kanaCards = room.cards;

  if (allReady) {
    room.currentCardIndex++;
    room.players.forEach((player) => {
      player.ready = false;
    });

    if (room.currentCardIndex >= kanaCards.length) {
      room.status = 'completed';
      console.log(`assessment-completed (ready): room=${roomCode}`);
      io.to(roomCode).emit('assessment-completed', {
        room,
        results: buildAssessmentResults(room),
      });
    } else {
      room.status = 'active';
      console.log(`card-updated (ready): room=${roomCode} index=${room.currentCardIndex}`);
      io.to(roomCode).emit('card-updated', {
        currentCardIndex: room.currentCardIndex,
        room,
      });
    }
  }
}

/** @param {SocketServer} io @param {string} roomCode */
export function tryAdvanceIfAllSubmitted(io: SocketServer, roomCode: string): void {
  const room = roomState.rooms.get(roomCode);
  if (!room) return;

  const kanaCards = room.cards;
  const idx = room.currentCardIndex;
  const allSubmitted = room.players.length > 0 && room.players.every((player) => (player.answers || [])[idx] !== undefined);

  if (!allSubmitted) return;

  room.currentCardIndex++;

  if (room.currentCardIndex >= kanaCards.length) {
    room.status = 'completed';
    console.log(`assessment-completed (tryAdvanceIfAllSubmitted): room=${roomCode}`);
    io.to(roomCode).emit('assessment-completed', {
      room,
      results: buildAssessmentResults(room),
    });
  } else {
    room.players.forEach((player) => {
      player.ready = false;
    });
    console.log(`card-updated (tryAdvanceIfAllSubmitted): room=${roomCode} index=${room.currentCardIndex}`);
    io.to(roomCode).emit('card-updated', {
      currentCardIndex: room.currentCardIndex,
      room,
    });
  }
}

export const roomSocketData = {
  rooms: roomState.rooms,
  roomCleanupTimers: roomState.roomCleanupTimers,
  DISCONNECT_GRACE_PERIOD_MS: roomState.DISCONNECT_GRACE_PERIOD_MS,
  tryAdvanceIfAllSubmitted,
};
