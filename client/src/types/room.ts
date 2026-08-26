import type { ApiRecord, Deck } from './base';

/** Lifecycle of a multiplayer room as driven by the socket server. */
export type RoomStatus = 'waiting' | 'preparing' | 'active' | 'completed';

/** Player presence states broadcast by the socket server. */
export type PlayerPresence = 'online' | 'away' | 'offline' | 'disconnected' | 'in_lobby' | 'ready';

/** A player currently (or previously) part of a room. */
export type RoomPlayer = ApiRecord & {
  id?: string;
  userId?: string | null;
  sessionKey?: string;
  name: string;
  answers?: unknown[];
  hintsUsed?: number[];
  ready?: boolean;
  connected?: boolean;
  presence?: PlayerPresence;
  status?: string;
};

/** A multiplayer room state mirrored from the socket server. */
export type Room = ApiRecord & RoomSelectionHint & {
  code?: string;
  status?: RoomStatus;
  deckType?: Deck;
  cards?: ApiRecord[];
  players: RoomPlayer[];
  currentCardIndex?: number;
};

/** Normalized per-player result shown on the results screen. */
export type AssessmentResult = {
  name: string;
  userId: string | null;
  answers: unknown[];
  hintsUsed: number[];
};

/** The group filter picked for a kana/kanji room, echoed by the server. */
export type RoomSelectionHint = {
  selectedGroups?: string[];
};

/** Options used to create a room deck (normalized before being sent). */
export type DeckOptions = {
  type?: Deck;
  groups?: unknown[];
  maxLesson?: number;
  count?: number;
};

/**
 * Common shape for socket acknowledgement callbacks. The server resolves
 * room mutations with `{ success, message, room }` (see socket-room-utils.js).
 */
export type SocketAck<TRoom = Room> = {
  success?: boolean;
  message?: string;
  room?: TRoom;
};