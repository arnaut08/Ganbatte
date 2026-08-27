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

/** A friend / user summary carried inside friend socket payloads. */
type IdentityPayload = { display_name?: string };

/** Optional payload shape emitted by the socket server (fields optional). */
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
  inviterName?: string;
  inviterUserId?: string;
  inviterSocketId?: string;
  accepted?: boolean;
  inviteeName?: string;
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
    handleJoinRoom(roomFromUrl, getDisplayName());
  }, [getDisplayName, handleJoinRoom, isSocketReady, socket]);

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
      setIsSocketReady(true);
      if (roomCode) {
        newSocket.emit('set-player-presence', roomCode, status === 'lobby' ? 'in_lobby' : 'away');
      }
      if (newSocket.recovered) return;

      const savedSession = readRoomSession();
      // A fresh tab starts on the home screen, so the current UI status cannot
      // be used to decide whether a saved room should be restored. An explicit
      // leave clears this session; otherwise rejoin the still-live lobby.
      const shouldRestore = Boolean(savedSession?.roomCode && savedSession?.username);
    if (!shouldRestore || !savedSession) return;

      const { roomCode: savedRoomCode, username: savedUsername } = savedSession;
      newSocket.emit('rejoin-room', savedRoomCode, savedUsername, savedSession.sessionKey || getSessionKey(), user?.id, (response: SocketAck) => {
        if (!response?.success || !response.room) {
          clearRoomSession();
          return;
        }

        const nextRoom = response.room;
        setRoomCode(savedRoomCode);
        setUsername(savedUsername);
        setRoom(nextRoom);
        setKanaCards((nextRoom.cards as StudyCard[] | undefined) || []);
        if (nextRoom.status === 'completed') {
          setResults(normalizeRoomResults(nextRoom.players));
          transitionToStatus('results');
        } else if (nextRoom.status === 'preparing') {
          transitionToStatus('assessment-preparing');
        } else {
          transitionToStatus(nextRoom.status === 'active' ? 'assessment' : 'lobby');
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
      if (data?.room) {
        setRoom(data.room);
        setKanaCards((data.room.cards as StudyCard[] | undefined) || []);
      }
    });
    newSocket.on('room-created', (code: string) => {
      setRoomCode(code);
      transitionToStatus('lobby');
    });
    newSocket.on('assessment-preparing', (data: SocketPayload) => {
      setIsPreparingAssessment(true);
      if (data?.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards as StudyCard[]);
      }
      transitionToStatus('assessment-preparing');
    });
    newSocket.on('player-joined', (data: SocketPayload) => {
      if (data?.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards as StudyCard[]);
      }
    });
    newSocket.on('assessment-started', (data: SocketPayload) => {
      setIsPreparingAssessment(false);
      if (data?.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards as StudyCard[]);
      }
      transitionToStatus('assessment');
    });
    ['answer-submitted', 'hint-used', 'player-ready-updated'].forEach((eventName) => {
      newSocket.on(eventName, (data: SocketPayload) => {
        if (data?.room) setRoom(data.room);
      });
    });
    ['both-submitted', 'cards-updated'].forEach((eventName) => {
      newSocket.on(eventName, (data: SocketPayload) => {
        if (data?.room) {
          setRoom(data.room);
          if (data.room.cards) setKanaCards(data.room.cards as StudyCard[]);
        }
      });
    });
    newSocket.on('card-updated', (data: SocketPayload) => {
      if (data?.room) setRoom(data.room);
      else setRoom((previous: Room | null) => ({ ...(previous ?? {}), currentCardIndex: data.currentCardIndex }) as Room);
    });
    newSocket.on('assessment-completed', (data: SocketPayload) => {
      if (data?.room) setRoom(data.room);
      const rawResults = data?.results || (Array.isArray(data?.room?.players) ? data.room.players : []);
      setResults(normalizeRoomResults(rawResults));
      transitionToStatus('results');
    });
    newSocket.on('room-returned-to-lobby', (data: SocketPayload) => {
      if (!data?.room) return;
      setRoom(data.room);
      setKanaCards((data.room.cards as StudyCard[] | undefined) || []);
      setResults(null);
      setIsPreparingAssessment(false);
      setStatus('lobby');
    });
    newSocket.on('assessment-action-denied', (data: SocketPayload) => {
      setToast({ message: data?.message || 'Waiting for the host to choose an action.', type: 'warning' });
    });
    newSocket.on('assessment-action-requested', (data: SocketPayload) => {
      if (data?.hostSocketId && data.hostSocketId !== newSocket.id) return;
      const actionLabel = data?.action === 'replay' ? 'Start a New Assessment' : 'Start New Session';
      setToast({ message: `${data?.guestName || 'Your guest'} wants to ${actionLabel}.`, type: 'warning' });
    });
    newSocket.on('player-exited-lobby', (data: SocketPayload) => {
      if (!data?.room) return;
      setRoom(data.room);
      setKanaCards((data.room.cards as StudyCard[] | undefined) || []);
      setResults(null);
      setIsPreparingAssessment(false);
      setStatus('lobby');
      setToast({
        message: data.exitedPlayerWasHost ? 'The host exited the lobby. You are now the host.' : 'The guest exited the lobby.',
        type: 'warning',
      });
    });
    newSocket.on('player-left', (data: SocketPayload) => {
      const roomData = data?.room ?? { players: data?.players ?? [] };
      setRoom((previous: Room | null) => {
        const nextRoom = Array.isArray(roomData.players)
          ? ({ ...(previous ?? {}), ...roomData, players: roomData.players } as Room)
          : previous;
        if (Array.isArray(roomData.players) && roomData.players.length <= 1) {
          setToast({ message: 'Your opponent left the room.', type: 'warning' });
        }
        return nextRoom;
      });
    });
    newSocket.on('player-presence-updated', (data: SocketPayload) => {
      if (data?.room) {
        const payloadRoom = data.room;
        setRoom((previous: Room | null) => ({ ...(previous ?? {}), ...payloadRoom, players: payloadRoom.players || previous?.players || [] } as Room));
      }
    });
    newSocket.on('friend-request-received', () => {
      refreshFriendRequests(true);
      setToast({ message: 'You received a new friend request.', type: 'success' });
    });
    newSocket.on('friend-request-accepted', (data: SocketPayload) => {
      refreshFriendData(true);
      setToast({ message: `${data?.friend?.display_name || 'Your friend'} accepted your friend request.`, type: 'success' });
    });
    newSocket.on('friend-request-rejected', (data: SocketPayload) => {
      refreshFriendRequests(true);
      setToast({ message: `${data?.receiver?.display_name || 'Your friend request'} declined your friend request.`, type: 'warning' });
    });
    newSocket.on('friend-online', (data: SocketPayload) => {
      refreshFriends(true);
      setToast({ message: `${data?.displayName || 'Your friend'} is online.`, type: 'success' });
    });
    newSocket.on('room-invite-received', (data: SocketPayload) => {
      const assessmentLabel = data?.deckType === 'kanji'
        ? 'Kanji'
        : data?.deckType === 'grammar'
          ? 'Grammar'
          : 'Kana';
      setToast({
        message: `${data?.inviterName || 'A friend'} invited you to a ${assessmentLabel} assessment.`,
        type: 'warning',
        actions: [
          {
            label: 'Join',
            onClick: () => {
              const playerName = getDisplayName().trim();
              setUsername(playerName);
              setPrefillRoomCode('');
              const url = new URL(window.location.href);
              url.searchParams.delete('room');
              window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
              newSocket.emit('join-room', data.roomCode, playerName, getSessionKey(), user?.id, (response: SocketAck) => {
                const inviteRoomCode = data.roomCode;
                newSocket.emit('room-invite-response', {
                  roomCode: inviteRoomCode,
                  inviterUserId: data.inviterUserId,
                  inviterSocketId: data.inviterSocketId,
                  accepted: response?.success === true,
                });

                if (response?.success && response.room && inviteRoomCode) {
                  setRoomCode(inviteRoomCode);
                  saveRoomSession(inviteRoomCode, playerName);
                  setRoom(response.room);
                  setScreenHistory((currentHistory: AppStatus[]) => {
                    const lastStatus = currentHistory[currentHistory.length - 1] || 'selector';
                    return lastStatus === 'lobby' ? currentHistory : [...currentHistory, 'lobby'];
                  });
                  setStatus('lobby');
                } else {
                  setToast({ message: response?.message || 'Unable to join the room.', type: 'error' });
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
      setToast({
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
  // Keep one socket for the lifetime of the authenticated user. The callback
  // props are recreated by the room manager as state changes; including them
  // here would run this cleanup and disconnect the socket during navigation or
  // browser/tab switches.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, authRequired, user?.id]);

  return {
    socket,
    isSocketReady,
    getSessionKey,
    saveRoomSession,
    clearRoomSession,
    clearRoomQueryParam: () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
    },
    handleSetAwayStatus,
  };
}
