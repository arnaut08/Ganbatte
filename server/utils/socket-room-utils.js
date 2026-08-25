// @ts-check

import { generateRandomCards } from '../services/card-service.js';
import { KANA_SENTENCES } from '../data/kana-sentences.js';

/** @typedef {Record<string, unknown>} RoomCard */

/**
 * @typedef {Object} RoomPlayer
 * @property {string} name
 * @property {string=} id
 * @property {string=} userId
 * @property {string=} user_id
 * @property {unknown[]=} answers
 * @property {number[]=} hintsUsed
 * @property {boolean=} ready
 */

/**
 * @typedef {Object} Room
 * @property {RoomPlayer[]} players
 * @property {RoomCard[]=} cards
 * @property {number} currentCardIndex
 * @property {string} status
 */

/** @typedef {{ to: (roomCode: string) => { emit: (event: string, payload: unknown) => void } }} SocketServer */

export const roomState = {
  /** @type {Map<string, Room>} */
  rooms: new Map(),
  /** @type {Map<string, ReturnType<typeof setTimeout>>} */
  roomCleanupTimers: new Map(),
  DISCONNECT_GRACE_PERIOD_MS: 5 * 60 * 1000,
};

/** @param {Room} room */
export function buildAssessmentResults(room) {
  return room.players.map((player) => ({
    name: player.name,
    userId: player.userId ?? player.user_id ?? null,
    answers: Array.isArray(player.answers) ? player.answers : [],
    hintsUsed: Array.isArray(player.hintsUsed) ? player.hintsUsed : [],
  }));
}

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** @param {SocketServer} io @param {string} roomCode */
export function advanceRoomIfReady(io, roomCode) {
  const room = roomState.rooms.get(roomCode);
  if (!room) return;

  const allReady = room.players.length > 0 && room.players.every((player) => player.ready === true);
  const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);

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
export function tryAdvanceIfAllSubmitted(io, roomCode) {
  const room = roomState.rooms.get(roomCode);
  if (!room) return;

  const kanaCards = room.cards || generateRandomCards(KANA_SENTENCES, 10);
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
  KANA_SENTENCES,
  tryAdvanceIfAllSubmitted,
};
