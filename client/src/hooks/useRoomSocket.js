import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config';
import { supabase } from '../config/supabase';
import { getPlayerPresenceStatus } from '../utils/roomStatus';
import {
  clearRoomSession,
  getSessionKey,
  readRoomSession,
  saveRoomSession,
} from '../utils/roomSession';

const ROOM_VIEW_STATUSES = ['lobby', 'assessment', 'results', 'assessment-preparing'];

function normalizeRoomResults(rawResults = []) {
  return rawResults.map((player) => ({
    name: player.name,
    userId: player.userId ?? player.user_id ?? null,
    answers: Array.isArray(player.answers) ? player.answers : [],
    hintsUsed: Array.isArray(player.hintsUsed) ? player.hintsUsed : [],
  }));
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
}) {
  const [socket, setSocket] = useState(null);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const inviteJoinAttemptedRef = useRef(false);
  const lastPresenceSyncRef = useRef(null);

  const handleSetAwayStatus = useCallback((nextStatus) => {
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
      const shouldRestore = ROOM_VIEW_STATUSES.includes(statusRef.current)
        && Boolean(savedSession?.roomCode && savedSession?.username);
      if (!shouldRestore) return;

      const { roomCode: savedRoomCode, username: savedUsername } = savedSession;
      newSocket.emit('rejoin-room', savedRoomCode, savedUsername, getSessionKey(), user?.id, (response) => {
        if (!response?.success) {
          clearRoomSession();
          return;
        }

        const nextRoom = response.room;
        setRoomCode(savedRoomCode);
        setUsername(savedUsername);
        setRoom(nextRoom);
        setKanaCards(nextRoom.cards || []);
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

    newSocket.on('player-rejoined', (data) => {
      if (data?.room) {
        setRoom(data.room);
        setKanaCards(data.room.cards || []);
      }
    });
    newSocket.on('room-created', (code) => {
      setRoomCode(code);
      transitionToStatus('lobby');
    });
    newSocket.on('assessment-preparing', (data) => {
      setIsPreparingAssessment(true);
      if (data?.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
      transitionToStatus('assessment-preparing');
    });
    newSocket.on('player-joined', (data) => {
      if (data?.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
    });
    newSocket.on('assessment-started', (data) => {
      setIsPreparingAssessment(false);
      if (data?.room) {
        setRoom(data.room);
        if (data.room.cards) setKanaCards(data.room.cards);
      }
      transitionToStatus('assessment');
    });
    ['answer-submitted', 'hint-used', 'player-ready-updated'].forEach((eventName) => {
      newSocket.on(eventName, (data) => {
        if (data?.room) setRoom(data.room);
      });
    });
    ['both-submitted', 'cards-updated'].forEach((eventName) => {
      newSocket.on(eventName, (data) => {
        if (data?.room) {
          setRoom(data.room);
          if (data.room.cards) setKanaCards(data.room.cards);
        }
      });
    });
    newSocket.on('card-updated', (data) => {
      if (data?.room) setRoom(data.room);
      else setRoom((previous) => ({ ...previous, currentCardIndex: data.currentCardIndex }));
    });
    newSocket.on('assessment-completed', (data) => {
      if (data?.room) setRoom(data.room);
      const rawResults = data?.results || (Array.isArray(data?.room?.players) ? data.room.players : []);
      setResults(normalizeRoomResults(rawResults));
      transitionToStatus('results');
    });
    newSocket.on('room-returned-to-lobby', (data) => {
      if (!data?.room) return;
      setRoom(data.room);
      setKanaCards(data.room.cards || []);
      setResults(null);
      setIsPreparingAssessment(false);
      setStatus('lobby');
    });
    newSocket.on('assessment-action-denied', (data) => {
      setToast({ message: data?.message || 'Waiting for the host to choose an action.', type: 'warning' });
    });
    newSocket.on('assessment-action-requested', (data) => {
      if (data?.hostSocketId && data.hostSocketId !== newSocket.id) return;
      const actionLabel = data?.action === 'replay' ? 'Start a New Assessment' : 'Start New Session';
      setToast({ message: `${data?.guestName || 'Your guest'} wants to ${actionLabel}.`, type: 'warning' });
    });
    newSocket.on('player-exited-lobby', (data) => {
      if (!data?.room) return;
      setRoom(data.room);
      setKanaCards(data.room.cards || []);
      setResults(null);
      setIsPreparingAssessment(false);
      setStatus('lobby');
      setToast({
        message: data.exitedPlayerWasHost ? 'The host exited the lobby. You are now the host.' : 'The guest exited the lobby.',
        type: 'warning',
      });
    });
    newSocket.on('player-left', (data) => {
      const roomData = data?.room ?? { players: data?.players ?? [] };
      setRoom((previous) => {
        const nextRoom = Array.isArray(roomData.players)
          ? { ...(previous ?? {}), ...roomData, players: roomData.players }
          : previous;
        if (Array.isArray(roomData.players) && roomData.players.length <= 1) {
          setToast({ message: 'Your opponent left the room.', type: 'warning' });
        }
        return nextRoom;
      });
    });
    newSocket.on('player-presence-updated', (data) => {
      if (data?.room) setRoom((previous) => ({ ...(previous ?? {}), ...data.room, players: data.room.players || previous?.players || [] }));
    });
    newSocket.on('friend-request-received', () => {
      refreshFriendRequests(true);
      setToast({ message: 'You received a new friend request.', type: 'success' });
    });
    newSocket.on('friend-request-accepted', (data) => {
      refreshFriendData(true);
      setToast({ message: `${data?.friend?.display_name || 'Your friend'} accepted your friend request.`, type: 'success' });
    });
    newSocket.on('friend-request-rejected', (data) => {
      refreshFriendRequests(true);
      setToast({ message: `${data?.receiver?.display_name || 'Your friend request'} declined your friend request.`, type: 'warning' });
    });
    newSocket.on('friend-online', (data) => {
      refreshFriends(true);
      setToast({ message: `${data?.displayName || 'Your friend'} is online.`, type: 'success' });
    });
    newSocket.on('room-invite-received', (data) => {
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
              newSocket.emit('join-room', data.roomCode, playerName, getSessionKey(), user?.id, (response) => {
                newSocket.emit('room-invite-response', {
                  roomCode: data.roomCode,
                  inviterSocketId: data.inviterSocketId,
                  accepted: response?.success === true,
                });

                if (response?.success) {
                  setRoomCode(data.roomCode);
                  saveRoomSession(data.roomCode, playerName);
                  setRoom(response.room);
                  setScreenHistory((currentHistory) => {
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
              inviterSocketId: data.inviterSocketId,
              accepted: false,
            }),
          },
        ],
      });
    });
    newSocket.on('room-invite-responded', (data) => {
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
  }, [authLoading, authRequired, refreshFriendData, refreshFriendRequests, refreshFriends, user?.id]);

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
