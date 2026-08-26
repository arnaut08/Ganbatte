import { createContext, useContext, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import type { AssessmentResult, DeckOptions, Friend, FriendRequest, GrammarQuestion, Room, StudyCard } from '../types';

export type RoomContextValue = {
  socket: Socket | null;
  isSocketReady: boolean;
  room: Room | null;
  roomCode: string;
  currentSessionKey: string;
  username: string;
  kanaCards: StudyCard[];
  results: AssessmentResult[] | null;
  grammarQuestions: GrammarQuestion[];
  prefillRoomCode: string;
  friends: Friend[];
  friendRequests: FriendRequest[];
  friendSearchResults: Friend[];
  isFriendSearchLoading: boolean;
  isPreparingAssessment: boolean;
  handleCreateRoom: (deckOptions?: DeckOptions) => Promise<void>;
  handleJoinRoom: (code: string) => void;
  handleReturnToRoom: () => void;
  handleDeclineRoomResume: () => void;
  handleSearchUsers: (query: string) => Promise<void>;
  handleRemoveFriend: (userId: string) => Promise<void>;
  handleSendFriendRequest: (userId: string) => Promise<void>;
  handleAcceptFriendRequest: (requestId: string) => Promise<void>;
  handleRejectFriendRequest: (requestId: string) => Promise<void>;
  handleStartAssessment: () => void;
  handleLeaveRoom: () => void;
  handleInviteFriend: (friendId: string) => void;
  handleNextCard: () => void;
  handleSubmitAnswer: (answer: unknown) => void;
  handleUseHint: (cardIndex: number) => void;
  handleReplayAssessment: () => void;
  handleStartNewSession: () => void;
  handleRequestHost: (action: string) => void;
  isCurrentPlayerHost: boolean;
};

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ value, children }: { value: RoomContextValue; children: ReactNode }) {
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomContext(): RoomContextValue {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoomContext must be used within RoomProvider');
  return context;
}