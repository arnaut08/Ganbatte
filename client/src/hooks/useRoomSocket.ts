import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { User } from '@supabase/supabase-js';
import { SERVER_URL } from '../config';
import { supabase } from '../config/supabase';
import { getPlayerPresenceStatus } from '../utils/roomStatus';
import {
  clearRoomSession,
  getSessionKey,
  readRoomSession,
  saveRoomSession,
} from '../utils/roomSession';
import type {
  AppStatus,
  AssessmentResult,
  Room,
  RoomPlayer,
  SocketAck,
  StudyCard,
  Toast,
} from '../types';

type RoomSocketOptions = {
  authRequired: boolean;
  authLoading: boolean;
  user: User | null;
  status: AppStatus;
  roomCode: string | null;
  room: Room | null;
  statusRef: MutableRefObject<AppStatus>;
  getDisplayName: () => string;
  handleJoinRoom: (code: string, name: string, onResult?: ((response: SocketAck) => void) | null) => void;
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

type IdentityPayload = { display_name?: string };

type SocketPayload = {
  room?: Room;
  players?: RoomPlayer[];
  currentCardIndex?: number;
  results?: unknown[];
  message?: string;
  hostSocketId?: string;
  action?: string;
  guestName?: string;
  exitedPlayerWasHost?: boolean;
  deckType?: string;
  roomCode?: string;
  seed?: number;
  inviterName?: string;
  inviterUserId?: string;
  inviterSocketId?: string;
  accepted?: boolean;
  inviteeName?: string;
  forfeitingPlayerName?: string;
  winnerUserId?: string | null;
  winnerPlayerName?: string;
  returnedBySocketId?: string;
  returnedByPlayerName?: string;
  winnerSocketId?: string;
  loserSocketId?: string;
  friend?: IdentityPayload;
  receiver?: IdentityPayload;
  displayName?: string;
  success?: boolean;
};

function normalizeRoomResults(rawResults: unknown[] = []): AssessmentResult[] {
  return rawResults.map((entry) => {
    const player = (entry ?? {}) as Record<string, unknown>;
    return {
      name: String(player.name ?? ''),
      userId: (player.userId as string | null | undefined) ?? (player.user_id as string | null | undefined) ?? null,
      answers: Array.isArray(player.answers) ? player.answers : [],
      hintsUsed: Array.isArray(player.hintsUsed) ? (player.hintsUsed as number[]) : [],
    };
  });
}

export default function useRoomSocket({
  authRequired,
  authLoading,
  user,
  status,
  roomCode,
  room,
  statusRef,
  getDisplayName,
  handleJoinRoom,
  transitionToStatus,
  refreshFriends,
  refreshFriendData,
  refreshFriendRequests,
  setRoomCode,
  setRoom,
  setUsername,
  setKanaCards,
  setResults,
  setPrefillRoomCode,
  setStatus,
  setScreenHistory,
  setIsPreparingAssessment,
  setToast,
}: RoomSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const inviteJoinAttemptedRef = useRef(false);
  const lastPresenceSyncRef = useRef<string | null>(null);
  const latestOptionsRef = useRef({
    status,
    roomCode,
    user,
    getDisplayName,
    handleJoinRoom,
    transitionToStatus,
    refreshFriends,
    refreshFriendData,
    refreshFriendRequests,
    setRoomCode,
    setRoom,
    setUsername,
    setKanaCards,
    setResults,
    setStatus,
    setScreenHistory,
    setIsPreparingAssessment,
    setToast,
  });
  latestOptionsRef.current = {
    status,
    roomCode,
    user,
    getDisplayName,
    handleJoinRoom,
    transitionToStatus,
    refreshFriends,
    refreshFriendData,
    refreshFriendRequests,
    setRoomCode,
    setRoom,
    setUsername,
    setKanaCards,
    setResults,
    setStatus,
    setScreenHistory,
    setIsPreparingAssessment,
    setToast,
  };

  const clearRoomQueryParam = useCallback(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('room')) {
      url.searchParams.delete('room');
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const forceRoomStatus = useCallback((nextStatus: AppStatus) => {
    setStatus(nextStatus);
    setScreenHistory((prev) => (prev[prev.length - 1] === nextStatus ? prev : [...prev, nextStatus]));
  }, [setScreenHistory, setStatus]);

  const handleSetAwayStatus = useCallback((nextStatus: string) => {
    if (!socket || !roomCode) return;
    const roomPresenceKey = `${roomCode}:${nextStatus}`;
    if (lastPresenceSyncRef.current === roomPresenceKey) return;

    const currentPlayer = room?.players?.find((player) => player.id === socket.id);
    if (getPlayerPresenceStatus(currentPlayer) === nextStatus) return;

    lastPresenceSyncRef.current = roomPresenceKey;
    socket.emit('set-player-presence', roomCode, nextStatus);
  }, [room, roomCode, socket]);

  useEffect(() => {
    if (!socket || !roomCode) return undefined;
    const nextStatus = status === 'lobby' ? 'in_lobby' : 'away';
    handleSetAwayStatus(nextStatus);
    return undefined;
  }, [handleSetAwayStatus, roomCode, socket, status]);

  useEffect(() => {
    lastPresenceSyncRef.current = null;
  }, [roomCode]);

  useEffect(() => {
    if (!socket || !roomCode || !room?.players?.some((player) => player.id === socket.id)) return undefined;

    const targetStatus = status === 'lobby' ? 'in_lobby' : 'away';
    const currentPlayer = room.players.find((player) => player.id === socket.id);
    if (getPlayerPresenceStatus(currentPlayer) !== targetStatus) {
      lastPresenceSyncRef.current = null;
      handleSetAwayStatus(targetStatus);
    }
    return undefined;
  }, [handleSetAwayStatus, room, roomCode, socket, status]);

  useEffect(() => {
    if (!socket || !roomCode) return undefined;

    const handleVisibilityChange = () => {
      handleSetAwayStatus(!document.hidden && status === 'lobby' ? 'in_lobby' : 'away');
    };
    const handleWindowFocus = () => handleSetAwayStatus(status === 'lobby' ? 'in_lobby' : 'away');
    const handleWindowBlur = () => handleSetAwayStatus('away');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [handleSetAwayStatus, roomCode, socket, status]);

  useEffect(() => {
    if (!socket || !isSocketReady || inviteJoinAttemptedRef.current) return;
    const roomFromUrl = (new URLSearchParams(window.location.search).get('room') || '').trim().toUpperCase();
    if (!roomFromUrl) return;

    inviteJoinAttemptedRef.current = true;
    handleJoinRoom(roomFromUrl, getDisplayName(), (response: SocketAck) => {
      if (response?.success) {
        forceRoomStatus('lobby');
      }
    });
  }, [forceRoomStatus, getDisplayName, handleJoinRoom, isSocketReady, socket]);

  useEffect(() => {
    if (authRequired && authLoading) return undefined;
    if (authRequired && !user) return undefined;

    const newSocket = io(SERVER_URL, {
      auth: async (callback) => {
        const { data } = (await supabase?.auth.getSession()) || { data: { session: null } };
        callback({ accessToken: data.session?.access_token || null });
      },
      reconnection: !authRequired || Boolean(user),
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      const currentOptions = latestOptionsRef.current;
      setIsSocketReady(true);
      if (currentOptions.roomCode) {
        newSocket.emit('set-player-presence', currentOptions.roomCode, currentOptions.status === 'lobby' ? 'in_lobby' : 'away');
      }
      if (newSocket.recovered) return;

      const savedSession = readRoomSession();
      const shouldRestore = Boolean(savedSession?.roomCode && savedSession?.username);
      if (!shouldRestore || !savedSession) return;

      const { roomCode: savedRoomCode, username: savedUsername } = savedSession;
      newSocket.emit('rejoin-room', savedRoomCode, savedUsername, savedSession.sessionKey || getSessionKey(), currentOptions.user?.id, (response: SocketAck) => {
        if (!response?.success || !response.room) {
          clearRoomSession();
          clearRoomQueryParam();
          return;
        }

        const nextRoom = response.room;

        // If the rehydrated room is already finished, clear room session and stay on Home
        if (nextRoom.status === 'completed') {
          clearRoomSession();
          clearRoomQueryParam();
          currentOptions.setRoom(null);
          currentOptions.setRoomCode(null);
          currentOptions.setResults(null);
          currentOptions.setStatus('selector');
          currentOptions.setScreenHistory(['selector']);
          return;
        }

        currentOptions.setRoomCode(savedRoomCode);
        currentOptions.setUsername(savedUsername);
        currentOptions.setRoom(nextRoom);
        currentOptions.setKanaCards((nextRoom.cards as StudyCard[] | undefined) || []);

        if (nextRoom.status === 'preparing') {
          currentOptions.setStatus('assessment-preparing');
          currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'assessment-preparing' ? previous : [...previous, 'assessment-preparing']);
        } else if (nextRoom.status === 'active') {
          currentOptions.setStatus('assessment');
          currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'assessment' ? previous : [...previous, 'assessment']);
        } else {
          currentOptions.setStatus('lobby');
          currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'lobby' ? previous : [...previous, 'lobby']);
        }
      });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !newSocket.connected) newSocket.connect();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    newSocket.on('disconnect', (reason) => {
      setIsSocketReady(false);
      if (reason === 'io server disconnect') newSocket.connect();
    });
    newSocket.on('connect_error', () => setIsSocketReady(false));

    newSocket.on('player-rejoined', (data: SocketPayload) => {
      const currentOptions = latestOptionsRef.current;
      if (data?.room) {
        currentOptions.setRoom(data.room);
        currentOptions.setKanaCards((data.room.cards as StudyCard[] | undefined) || []);
      }
    });

    newSocket.on('room-created', (code: string) => {
      const currentOptions = latestOptionsRef.current;
      currentOptions.setRoomCode(code);
      currentOptions.setStatus('lobby');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'lobby' ? previous : [...previous, 'lobby']);
    });

    newSocket.on('assessment-preparing', (data: SocketPayload) => {
      const currentOptions = latestOptionsRef.current;
      currentOptions.setIsPreparingAssessment(true);
      if (data?.room) {
        currentOptions.setRoom(data.room);
        if (data.room.cards) currentOptions.setKanaCards(data.room.cards as StudyCard[]);
      }
      currentOptions.setStatus('assessment-preparing');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'assessment-preparing' ? previous : [...previous, 'assessment-preparing']);
    });

    newSocket.on('player-joined', (data: SocketPayload) => {
      const currentOptions = latestOptionsRef.current;
      if (data?.room) {
        currentOptions.setRoom(data.room);
        if (data.room.cards) currentOptions.setKanaCards(data.room.cards as StudyCard[]);
      }
    });

    newSocket.on('assessment-started', (data: SocketPayload) => {
      const currentOptions = latestOptionsRef.current;
      currentOptions.setIsPreparingAssessment(false);
      if (data?.room) {
        currentOptions.setRoom(data.room);
        if (data.room.cards) currentOptions.setKanaCards(data.room.cards as StudyCard[]);
      }
      currentOptions.setStatus('assessment');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'assessment' ? previous : [...previous, 'assessment']);
    });

    newSocket.on('gauntlet-started', (data: SocketPayload) => {
      const currentOptions = latestOptionsRef.current;
      if (data?.room) currentOptions.setRoom(data.room);
      currentOptions.setStatus('gauntlet');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'gauntlet' ? previous : [...previous, 'gauntlet']);
    });

    newSocket.on('assessment-generation-failed', (data: SocketPayload) => {
      const currentOptions = latestOptionsRef.current;
      currentOptions.setIsPreparingAssessment(false);
      if (data?.room) {
        currentOptions.setRoom(data.room);
        currentOptions.setKanaCards((data.room.cards as StudyCard[] | undefined) || []);
      }
      currentOptions.setResults(null);
      currentOptions.setStatus('lobby');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'lobby' ? previous : [...previous, 'lobby']);
      currentOptions.setToast({
        message: data?.message || 'The assessment deck could not be generated. Please try again.',
        type: 'warning',
      });
    });

    ['answer-submitted', 'hint-used', 'player-ready-updated'].forEach((eventName) => {
      newSocket.on(eventName, (data: SocketPayload) => {
        if (data?.room) latestOptionsRef.current.setRoom(data.room);
      });
    });

    ['both-submitted', 'cards-updated'].forEach((eventName) => {
      newSocket.on(eventName, (data: SocketPayload) => {
        if (data?.room) {
          latestOptionsRef.current.setRoom(data.room);
          if (data.room.cards) latestOptionsRef.current.setKanaCards(data.room.cards as StudyCard[]);
        }
      });
    });

    newSocket.on('card-updated', (data: SocketPayload) => {
      if (data?.room) latestOptionsRef.current.setRoom(data.room);
      else latestOptionsRef.current.setRoom((previous: Room | null) => ({ ...(previous ?? {}), currentCardIndex: data.currentCardIndex }) as Room);
    });

    newSocket.on('assessment-completed', (data: SocketPayload) => {
      const currentOptions = latestOptionsRef.current;
      if (data?.room) currentOptions.setRoom(data.room);
      const rawResults = data?.results || (Array.isArray(data?.room?.players) ? data.room.players : []);
      currentOptions.setResults(normalizeRoomResults(rawResults));
      currentOptions.setStatus('results');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'results' ? previous : [...previous, 'results']);
      clearRoomSession();
      clearRoomQueryParam();
    });

    newSocket.on('gauntlet-match-completed', (data: SocketPayload) => {
      if (!data?.room) return;
      const currentOptions = latestOptionsRef.current;
      currentOptions.setRoom({ ...data.room, winnerSocketId: data.winnerSocketId });
      currentOptions.setResults(null);
      currentOptions.setIsPreparingAssessment(false);
      currentOptions.setStatus('gauntlet');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'gauntlet' ? previous : [...previous, 'gauntlet']);
    });

    newSocket.on('match-forfeited', (data: SocketPayload) => {
      latestOptionsRef.current.setToast({
        message: `${data?.forfeitingPlayerName || 'Your opponent'} forfeited the match. You win!`,
        type: 'success',
      });
    });

    newSocket.on('room-returned-to-lobby', (data: SocketPayload) => {
      if (!data?.room) return;
      const currentOptions = latestOptionsRef.current;
      currentOptions.setRoom(data.room);
      currentOptions.setKanaCards((data.room.cards as StudyCard[] | undefined) || []);
      currentOptions.setResults(null);
      currentOptions.setIsPreparingAssessment(false);
      currentOptions.setStatus('lobby');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'lobby' ? previous : [...previous, 'lobby']);
      if (data.returnedBySocketId !== newSocket.id) {
        currentOptions.setToast({
          message: `${data.returnedByPlayerName || 'Your opponent'} returned the room to the lobby.`,
          type: 'neutral',
        });
      }
    });

    newSocket.on('assessment-action-denied', (data: SocketPayload) => {
      latestOptionsRef.current.setToast({ message: data?.message || 'Waiting for the host to choose an action.', type: 'warning' });
    });

    newSocket.on('assessment-action-requested', (data: SocketPayload) => {
      if (data?.hostSocketId && data.hostSocketId !== newSocket.id) return;
      const actionLabel = data?.action === 'replay' ? 'Start a New Assessment' : 'Start New Session';
      latestOptionsRef.current.setToast({ message: `${data?.guestName || 'Your guest'} wants to ${actionLabel}.`, type: 'neutral' });
    });

    newSocket.on('player-exited-lobby', (data: SocketPayload) => {
      if (!data?.room) return;
      const currentOptions = latestOptionsRef.current;
      currentOptions.setRoom(data.room);
      currentOptions.setKanaCards((data.room.cards as StudyCard[] | undefined) || []);
      currentOptions.setResults(null);
      currentOptions.setIsPreparingAssessment(false);
      clearRoomSession();
      clearRoomQueryParam();
      currentOptions.setStatus('lobby');
      currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'lobby' ? previous : [...previous, 'lobby']);
      currentOptions.setToast({
        message: data.exitedPlayerWasHost ? 'The host exited the lobby. You are now the host.' : 'The guest exited the lobby.',
        type: 'warning',
      });
    });

    newSocket.on('player-left', (data: SocketPayload) => {
      const roomData = data?.room ?? { players: data?.players ?? [] };
      latestOptionsRef.current.setRoom((previous: Room | null) => {
        const nextRoom = Array.isArray(roomData.players)
          ? ({ ...(previous ?? {}), ...roomData, players: roomData.players } as Room)
          : previous;
        if (Array.isArray(roomData.players) && roomData.players.length <= 1) {
          latestOptionsRef.current.setToast({ message: 'Your opponent left the room.', type: 'warning' });
        }
        return nextRoom;
      });
    });

    newSocket.on('player-presence-updated', (data: SocketPayload) => {
      if (data?.room) {
        const payloadRoom = data.room;
        latestOptionsRef.current.setRoom((previous: Room | null) => ({ ...(previous ?? {}), ...payloadRoom, players: payloadRoom.players || previous?.players || [] } as Room));
      }
    });

    newSocket.on('friend-request-received', () => {
      latestOptionsRef.current.refreshFriendRequests(true);
      latestOptionsRef.current.setToast({ message: 'You received a new friend request.', type: 'neutral' });
    });

    newSocket.on('friend-request-accepted', (data: SocketPayload) => {
      latestOptionsRef.current.refreshFriendData(true);
      latestOptionsRef.current.setToast({ message: `${data?.friend?.display_name || 'Your friend'} accepted your friend request.`, type: 'success' });
    });

    newSocket.on('friend-request-rejected', (data: SocketPayload) => {
      latestOptionsRef.current.refreshFriendRequests(true);
      latestOptionsRef.current.setToast({ message: `${data?.receiver?.display_name || 'Your friend request'} declined your friend request.`, type: 'warning' });
    });

    newSocket.on('friend-online', (data: SocketPayload) => {
      latestOptionsRef.current.refreshFriends(true);
      latestOptionsRef.current.setToast({ message: `${data?.displayName || 'Your friend'} is online.`, type: 'neutral' });
    });

    newSocket.on('room-invite-received', (data: SocketPayload) => {
      const assessmentLabel = data?.deckType === 'kanji'
        ? 'Kanji'
        : data?.deckType === 'vocab'
          ? 'Vocabulary'
        : data?.deckType === 'grammar'
          ? 'Grammar'
          : 'Kana';
      latestOptionsRef.current.setToast({
        message: `${data?.inviterName || 'A friend'} invited you to a ${assessmentLabel} assessment.`,
        type: 'neutral',
        actions: [
          {
            label: 'Join',
            onClick: () => {
              const currentOptions = latestOptionsRef.current;
              const playerName = currentOptions.getDisplayName().trim();
              currentOptions.handleJoinRoom(data.roomCode || '', playerName, (response: SocketAck) => {
                const inviteRoomCode = data.roomCode;
                newSocket.emit('room-invite-response', {
                  roomCode: inviteRoomCode,
                  inviterUserId: data.inviterUserId,
                  inviterSocketId: data.inviterSocketId,
                  accepted: response?.success === true,
                });
                if (response?.success) {
                  currentOptions.setStatus('lobby');
                  currentOptions.setScreenHistory((previous) => previous[previous.length - 1] === 'lobby' ? previous : [...previous, 'lobby']);
                }
              });
            },
          },
          {
            label: 'Reject',
            onClick: () => newSocket.emit('room-invite-response', {
              roomCode: data.roomCode,
              inviterUserId: data.inviterUserId,
              inviterSocketId: data.inviterSocketId,
              accepted: false,
            }),
          },
        ],
      });
    });

    newSocket.on('room-invite-responded', (data: SocketPayload) => {
      latestOptionsRef.current.setToast({
        message: data?.accepted
          ? `${data?.inviteeName || 'Your friend'} joined room ${data?.roomCode || ''}.`
          : `${data?.inviteeName || 'Your friend'} declined your room invite.`,
        type: data?.accepted ? 'success' : 'warning',
      });
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setIsSocketReady(false);
      newSocket.disconnect();
    };
  }, [authLoading, authRequired, user?.id]);

  return {
    socket,
    isSocketReady,
    getSessionKey,
    saveRoomSession,
    clearRoomSession,
    clearRoomQueryParam,
    handleSetAwayStatus,
  };
}