import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Socket } from 'socket.io-client';
import type {
  AppStatus,
  AssessmentResult,
  Room,
  SocketAck,
  StudyCard,
  Toast,
} from '../types';
import useLegacyRoomSocket from './useRoomSocket.js';

export type RoomSocketOptions = {
  authRequired: boolean;
  authLoading: boolean;
  user: User | null;
  status: AppStatus;
  roomCode: string | null;
  room: Room | null;
  statusRef: MutableRefObject<AppStatus>;
  getDisplayName: () => string;
  handleJoinRoom: (code: string, name: string, onResult?: (response: SocketAck) => void) => void;
  transitionToStatus: (status: AppStatus) => void;
  refreshFriends: (force?: boolean) => Promise<void>;
  refreshFriendData: (force?: boolean) => Promise<void>;
  refreshFriendRequests: (force?: boolean) => Promise<void>;
  setRoomCode: Dispatch<SetStateAction<string | null>>;
  setRoom: Dispatch<SetStateAction<Room | null>>;
  setUsername: Dispatch<SetStateAction<string>>;
  setKanaCards: Dispatch<SetStateAction<StudyCard[]>>;
  setResults: Dispatch<SetStateAction<AssessmentResult[] | null>>;
  setPrefillRoomCode: Dispatch<SetStateAction<string>>;
  setStatus: Dispatch<SetStateAction<AppStatus>>;
  setScreenHistory: Dispatch<SetStateAction<AppStatus[]>>;
  setIsPreparingAssessment: Dispatch<SetStateAction<boolean>>;
  setToast: (toast: Toast) => void;
};

export type RoomSocketResult = {
  socket: Socket | null;
  isSocketReady: boolean;
  getSessionKey: () => string;
  saveRoomSession: (roomCode: string, username: string) => void;
  clearRoomSession: () => void;
  clearRoomQueryParam: () => void;
  handleSetAwayStatus: (nextStatus: string) => void;
};

export default function useRoomSocket(options: RoomSocketOptions): RoomSocketResult {
  return useLegacyRoomSocket(options) as RoomSocketResult;
}
