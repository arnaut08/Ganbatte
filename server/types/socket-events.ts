import type { Answer, Cards, RoomCode, SessionKey, Username } from '../utils/validation.js';
import type { Room } from '../utils/socket-room-utils.js';

export interface RoomCallbackResult { success: boolean; message?: string; room?: Room | unknown }
export type RoomCallback = (result: string | Room | RoomCallbackResult) => void;

export interface ClientToServerEvents {
  'authenticate-socket': (accessToken: string) => void;
  'create-room': (hostName: Username, sessionKey: SessionKey, userId?: string, callback?: RoomCallback) => void;
  'join-room': (roomCode: RoomCode, username: Username, sessionKey: SessionKey, userId?: string, callback?: RoomCallback) => void;
  'rejoin-room': (roomCode: RoomCode, username: Username, sessionKey: SessionKey, userId?: string, callback?: RoomCallback) => void;
  'get-room': (roomCode: RoomCode, callback: RoomCallback) => void;
  'set-cards': (roomCode: RoomCode, cards: Cards, callback: RoomCallback) => void;
  'submit-answer': (roomCode: RoomCode, answer: Answer) => void;
  'next-card': (roomCode: RoomCode) => void;
  'player-ready': (roomCode: RoomCode) => void;
  'use-hint': (roomCode: RoomCode, cardIndex: number) => void;
  'forfeit-match': (roomCode: RoomCode) => void;
  'leave-room': (roomCode: RoomCode, callback: RoomCallback) => void;
  'start-assessment': (roomCode: RoomCode, refreshDeck?: boolean) => void;
  'start-gauntlet': (roomCode: RoomCode) => void;
  'replay-assessment': (roomCode: RoomCode) => void;
  'return-to-lobby': (roomCode: RoomCode) => void;
  'exit-lobby': (roomCode: RoomCode, callback: RoomCallback) => void;
  'request-assessment-action': (roomCode: RoomCode, action: string) => void;
  'set-player-presence': (roomCode: RoomCode, presence: string, callback: RoomCallback) => void;
  'minefield-claim-attempt': (roomCode: RoomCode, tileId: string) => void;
  'invite-friend-to-room': (roomCode: RoomCode, targetUserId: string, callback: RoomCallback) => void;
  'room-invite-response': (data: Record<string, unknown>) => void;
}

export interface ServerToClientEvents {
  [event: string]: (payload: unknown) => void;
}
