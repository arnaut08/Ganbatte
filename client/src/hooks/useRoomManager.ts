import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Socket } from 'socket.io-client';
import { generateCards, getActiveMatchSession, getRoom } from '../services/api';
import type {
  ApiRecord,
  AppStatus,
  AssessmentResult,
  DeckOptions,
  GrammarQuestion,
  Room,
  SelectorScreen,
  SocketAck,
  StudyCard,
  ToastType,
} from '../types';
import { isStudyCard } from '../types';
import { canStartAssessment } from '../utils/roomStatus';
import { clearRoomQueryParam, clearRoomSession, getSessionKey, readRoomSession, saveRoomSession } from '../utils/roomSession';
import useRoomSocket from './useRoomSocket';
import { supabase } from '../config/supabase';

type NavigationState = {
  status: AppStatus;
  setStatus: Dispatch<SetStateAction<AppStatus>>;
  setSelectorScreen: Dispatch<SetStateAction<SelectorScreen>>;
  setScreenHistory: Dispatch<SetStateAction<AppStatus[]>>;
  statusRef: MutableRefObject<AppStatus>;
  transitionToStatus: (status: AppStatus) => void;
  getDisplayName: () => string;
  handleOpenGrammarPractice: (maxLesson?: number, count?: number, mode?: string) => Promise<void>;
};

/** Window helpers exposed for the legacy JS-driven practice flows. */
type PracticeAugmentedWindow = Window & {
  generateCards?: (count?: number, startAfter?: boolean) => Promise<void>;
  generateGrammarAssessment?: (maxLesson?: number, count?: number) => Promise<void>;
};

type RoomManagerOptions = {
  authRequired: boolean;
  authLoading: boolean;
  user: User | null;
  setToast: (toast: { message: string; type: ToastType }) => void;
  navigation: NavigationState;
  refreshFriends: (force?: boolean) => Promise<void>;
  refreshFriendData: (force?: boolean) => Promise<void>;
  refreshFriendRequests: (force?: boolean) => Promise<void>;
  socketRef: MutableRefObject<Socket | null>;
  roomCodeRef: MutableRefObject<string | null>;
  roomStatusRef: MutableRefObject<'lobby' | 'preparing' | 'active' | 'completed' | null>;
};

export default function useRoomManager({
  authRequired,
  authLoading,
  user,
  setToast,
  navigation,
  refreshFriends,
  refreshFriendData,
  refreshFriendRequests,
  socketRef,
  roomCodeRef,
  roomStatusRef,
}: RoomManagerOptions) {
  const visualFixture = typeof window !== 'undefined' && Boolean((window as any).__PLAYWRIGHT_VISUAL_TEST__);
  const visualFixtureRoom = visualFixture
    ? ((window as any).__PLAYWRIGHT_VISUAL_ROOM__ as Room | null)
    : null;
  const visualFixtureResults = visualFixture
    ? ((window as any).__PLAYWRIGHT_VISUAL_RESULTS__ as AssessmentResult[] | null)
    : null;
  const [roomCode, setRoomCode] = useState<string | null>(visualFixtureRoom?.code || null);
  const [room, setRoom] = useState<Room | null>(visualFixtureRoom);
  const [username, setUsername] = useState(visualFixtureRoom?.players?.[0]?.name || '');
  const [kanaCards, setKanaCards] = useState<StudyCard[]>(
    (visualFixtureRoom?.cards ?? []).filter(isStudyCard),
  );
  const [results, setResults] = useState<AssessmentResult[] | null>(visualFixtureResults);
  const [prefillRoomCode, setPrefillRoomCode] = useState('');
  const [grammarQuestions, setGrammarQuestions] = useState<GrammarQuestion[]>(
    (visualFixtureRoom?.cards ?? []).filter(
      (card): card is GrammarQuestion => typeof card === 'object' && card !== null && 'type' in card,
    ),
  );
  const [isPreparingAssessment, setIsPreparingAssessment] = useState(false);
  const [isHydratingActiveMatch, setIsHydratingActiveMatch] = useState(
    Boolean(user && !visualFixture && readRoomSession()?.roomCode),
  );
  const recoverySessionRef = useRef(visualFixture ? null : readRoomSession());
  const activeMatchCheckRef = useRef<string | null>(null);
  const { status, setStatus, setSelectorScreen, setScreenHistory, statusRef, transitionToStatus } = navigation;
  roomCodeRef.current = roomCode;
  roomStatusRef.current = room?.status === 'waiting' ? 'lobby' : room?.status ?? null;
  const getDisplayName = navigation.getDisplayName;

  const handleJoinRoom = useCallback((code: string, name: string, onResult: ((response: SocketAck) => void) | null = null) => {
    if (!socketRef.current) return;
    const playerName = (name || getDisplayName()).trim();
    if (!playerName) return;
    setUsername(playerName);
    setPrefillRoomCode('');
    clearRoomQueryParam();
    socketRef.current.emit('join-room', code, playerName, getSessionKey(), user?.id, (response: SocketAck) => {
      onResult?.(response);
      if (response.success && response.room) {
        setRoomCode(code);
        saveRoomSession(code, playerName);
        setRoom(response.room);
        setScreenHistory((currentHistory) => {
          const lastStatus = currentHistory[currentHistory.length - 1] || 'selector';
          return lastStatus === 'lobby' ? currentHistory : [...currentHistory, 'lobby'];
        });
        setStatus('lobby');
      } else setToast({ message: response.message || 'Unable to join the room.', type: 'error' });
    });
  }, [getDisplayName, setScreenHistory, setStatus, setToast, socketRef, user?.id]);

  const handleCreateRoom = useCallback(async (name: string, deckOptions: DeckOptions = {}) => {
    if (!socketRef.current) return;
    const hostName = (name || getDisplayName()).trim();
    if (!hostName) return;
    const normalizedDeckOptions = {
      type: deckOptions?.type === 'grammar' ? 'grammar' : deckOptions?.type === 'kanji' ? 'kanji' : deckOptions?.type === 'vocab' ? 'vocab' : 'kana',
      mode: deckOptions?.mode || 'standard',
      seed: deckOptions?.seed,
      groups: Array.isArray(deckOptions?.groups) ? deckOptions.groups : [],
      maxLesson: deckOptions?.type === 'grammar' ? Number(deckOptions.maxLesson) || 3 : undefined,
      count: deckOptions?.type === 'grammar' ? Number(deckOptions.count) || 5 : undefined,
    };
    setUsername(hostName);
    setPrefillRoomCode('');
    clearRoomQueryParam();
    socketRef.current.emit('create-room', hostName, getSessionKey(), user?.id, normalizedDeckOptions, (code: string) => {
      setRoomCode(code);
      saveRoomSession(code, hostName);
      getRoom(code).then((nextRoom) => {
        setRoom(nextRoom);
        if (nextRoom.cards) setKanaCards(nextRoom.cards.filter(isStudyCard));
        setScreenHistory((currentHistory) => {
          const lastStatus = currentHistory[currentHistory.length - 1] || 'selector';
          return lastStatus === 'lobby' ? currentHistory : [...currentHistory, 'lobby'];
        });
        transitionToStatus('lobby');
        const me = nextRoom.players.find((player) => player.id === socketRef.current?.id);
        if (me) setUsername(me.name);
      }).catch((error) => console.error('Failed to load room:', error));
    });
  }, [getDisplayName, setScreenHistory, socketRef, transitionToStatus, user?.id]);

  const handleGenerateCards = useCallback(async (count = 10, startAfter = false) => {
    try {
      const response = await generateCards(count);
      if (!response.cards) return;
      setKanaCards(response.cards);
      if (socketRef.current && roomCode) {
        socketRef.current.emit('set-cards', roomCode, response.cards, (result: SocketAck) => {
          if (result?.success && result.room) setRoom(result.room);
          if (startAfter) socketRef.current?.emit('start-assessment', roomCode);
        });
      } else if (startAfter) transitionToStatus('assessment');
    } catch (error) { console.error('Failed to generate cards', error); }
  }, [roomCode, socketRef, transitionToStatus]);

  const { socket, isSocketReady, rejoinRoom } = useRoomSocket({
    authRequired, authLoading, user, status, roomCode, room, statusRef, getDisplayName,
    handleJoinRoom, transitionToStatus, refreshFriends, refreshFriendData, refreshFriendRequests,
    setRoomCode, setRoom, setUsername, setKanaCards, setResults, setPrefillRoomCode,
    setStatus, setScreenHistory, setIsPreparingAssessment, setToast,
  });
  const activeSocket = socket as unknown as Socket | null;
  socketRef.current = socket;

  // Sync / Re-authenticate socket when user logs in post email-verification
  useEffect(() => {
    if (!activeSocket || !supabase) return;

    if (user?.id) {
      supabase.auth.getSession().then(({ data }) => {
        const token = data.session?.access_token;
        if (token) {
          activeSocket.auth = { ...(activeSocket.auth || {}), accessToken: token };
          if (!activeSocket.connected) {
            activeSocket.connect();
          } else {
            activeSocket.emit('authenticate-socket', token);
          }
        }
      });
    }
  }, [user?.id, activeSocket]);

  useEffect(() => {
    if (!user?.id) {
      activeMatchCheckRef.current = null;
      if (!authLoading) recoverySessionRef.current = null;
      setIsHydratingActiveMatch(false);
      return;
    }
    if (!recoverySessionRef.current?.roomCode) {
      setIsHydratingActiveMatch(false);
      return;
    }
    if (!isSocketReady || !activeSocket || activeMatchCheckRef.current === user.id) return;

    activeMatchCheckRef.current = user.id;
    setIsHydratingActiveMatch(true);
    getActiveMatchSession(getSessionKey()).then((response) => {
      const activeRoom = response.user_in_active_match ? response.room : null;
      if (!activeRoom || !activeRoom.code) {
        clearRoomSession();
        recoverySessionRef.current = null;
        setRoomCode(null);
        setRoom(null);
        setResults(null);
        setIsPreparingAssessment(false);
        if (statusRef.current === 'assessment' || statusRef.current === 'assessment-preparing' || statusRef.current === 'gauntlet') {
          setStatus('selector');
          setSelectorScreen('practice');
          setScreenHistory(['selector']);
        }
        return;
      }
      const activeRoomCode = activeRoom.code;

      const player = activeRoom.players.find((candidate) => candidate.userId === user.id)
        || activeRoom.players.find((candidate) => candidate.sessionKey === getSessionKey());
      const playerName = player?.name || getDisplayName();
      setRoomCode(activeRoomCode);
      setUsername(playerName);
      saveRoomSession(activeRoomCode, playerName);
      setRoom(activeRoom);
      setKanaCards((activeRoom.cards ?? []).filter(isStudyCard));
      return new Promise<void>((resolve) => {
        const started = rejoinRoom(activeRoomCode, playerName, (ack: SocketAck) => {
          if (ack?.success && ack.room) {
            setRoom(ack.room);
            setKanaCards((ack.room.cards ?? []).filter(isStudyCard));
            if (ack.room.status === 'preparing') {
              transitionToStatus('assessment-preparing');
            } else if (ack.room.status === 'active') {
              if (ack.room.mode === 'gauntlet') {
                transitionToStatus('gauntlet');
              } else {
                transitionToStatus('assessment');
              }
            }
          }
          resolve();
        });
        if (!started) resolve();
      });
    }).catch((error) => {
      console.error('Failed to restore active match:', error);
    }).finally(() => setIsHydratingActiveMatch(false));
  }, [activeSocket, authLoading, getDisplayName, isSocketReady, rejoinRoom, setScreenHistory, setSelectorScreen, setStatus, statusRef, transitionToStatus, user?.id]);

  // Sync preparing state if updated over socket
  useEffect(() => {
    if (!room) return;
    if (room.status === 'preparing' && status !== 'assessment-preparing') {
      transitionToStatus('assessment-preparing');
      return;
    }
    if (room.status === 'active' && status === 'assessment-preparing') {
      setIsPreparingAssessment(false);
      if (room.mode === 'gauntlet') {
        transitionToStatus('gauntlet');
      } else {
        transitionToStatus('assessment');
      }
    }
  }, [room, status, transitionToStatus]);

  useEffect(() => {
    const practiceWindow = window as PracticeAugmentedWindow;
    practiceWindow.generateCards = handleGenerateCards;
    practiceWindow.generateGrammarAssessment = (maxLesson = 12, count = 10) => navigation.handleOpenGrammarPractice(maxLesson, count, 'practice');
    return () => { delete practiceWindow.generateCards; delete practiceWindow.generateGrammarAssessment; };
  }, [handleGenerateCards, navigation]);

  const isCurrentPlayerHost = room?.players?.[0]?.id === activeSocket?.id
    || (user?.id && room?.players?.[0]?.userId === user.id)
    || room?.players?.[0]?.sessionKey === getSessionKey();

  const handleInviteFriend = useCallback((friendId: string) => {
    if (!activeSocket || !roomCode || !friendId) return;
    activeSocket.emit('invite-friend-to-room', roomCode, friendId, (response: SocketAck) => {
      setToast({
        message: response?.success ? 'Room invite sent.' : (response?.message || 'Unable to send room invite.'),
        type: response?.success ? 'success' : 'error',
      });
    });
  }, [activeSocket, roomCode, setToast]);

  const handleStartAssessment = useCallback(() => {
    if (!activeSocket || !roomCode || !room || !isCurrentPlayerHost) return;
    if (!canStartAssessment(room.players)) return;
    if (room.deckType === 'grammar' || room.deckType === 'kana' || room.deckType === 'vocab') {
      setIsPreparingAssessment(true);
      transitionToStatus('assessment-preparing');
    }
    activeSocket.emit('start-assessment', roomCode);
  }, [activeSocket, isCurrentPlayerHost, room, roomCode, transitionToStatus]);

  const handleStartGauntlet = useCallback(() => {
    if (!activeSocket || !roomCode || !room || room.players.length < 2) return;
    activeSocket.emit('start-gauntlet', roomCode);
  }, [activeSocket, room, roomCode]);

  const handleReplayAssessment = useCallback(() => {
    if (!activeSocket || !roomCode || !room) return;
    if (!isCurrentPlayerHost) {
      setToast({ message: 'Waiting for the host to replay this assessment.', type: 'neutral' });
      return;
    }
    activeSocket.emit('replay-assessment', roomCode);
  }, [activeSocket, isCurrentPlayerHost, room, roomCode, setToast]);

  const handleRequestHost = useCallback((action: string) => {
    if (activeSocket && roomCode && room) activeSocket.emit('request-assessment-action', roomCode, action);
  }, [activeSocket, roomCode, room]);

  const handleSubmitAnswer = useCallback((answer: unknown) => {
    if (activeSocket && roomCode) activeSocket.emit('submit-answer', roomCode, answer);
  }, [activeSocket, roomCode]);

  const handleUseHint = useCallback((cardIndex: number) => {
    if (activeSocket && roomCode) activeSocket.emit('use-hint', roomCode, cardIndex);
  }, [activeSocket, roomCode]);

  const handleForfeitMatch = useCallback(() => {
    if (activeSocket && roomCode) activeSocket.emit('forfeit-match', roomCode);
  }, [activeSocket, roomCode]);

  const handleReturnGauntletToLobby = useCallback(() => {
    if (activeSocket && roomCode) activeSocket.emit('return-to-lobby', roomCode);
  }, [activeSocket, roomCode]);

  const handleNextCard = useCallback(() => {
    if (activeSocket && roomCode) activeSocket.emit('player-ready', roomCode);
  }, [activeSocket, roomCode]);

  const handleLeaveRoom = useCallback(() => {
    if (!activeSocket || !roomCode) return;
    activeSocket.emit('leave-room', roomCode, (response: SocketAck) => {
      if (response?.success) clearRoomSession();
      setRoomCode(null);
      setRoom(null);
      setUsername('');
      setResults(null);
      setPrefillRoomCode('');
      setStatus('selector');
      setSelectorScreen('practice');
    });
  }, [activeSocket, roomCode, setSelectorScreen, setStatus]);

  const handleStartNewSession = useCallback(() => {
    if (!activeSocket || !roomCode || !room) return;
    activeSocket.emit('exit-lobby', roomCode, (response: SocketAck) => {
      if (!response?.success) return;
      clearRoomSession();
      setRoomCode(null);
      setRoom(null);
      setUsername('');
      setResults(null);
      setPrefillRoomCode('');
      setStatus('selector');
      setSelectorScreen('practice');
    });
  }, [room, roomCode, setSelectorScreen, setStatus, activeSocket]);

  const clearRoomState = useCallback(() => {
    setRoomCode(null);
    setRoom(null);
    setUsername('');
    setKanaCards([]);
    setResults(null);
    setGrammarQuestions([]);
    setPrefillRoomCode('');
    setIsPreparingAssessment(false);
    roomStatusRef.current = null;
  }, [roomStatusRef]);

  const handleDeclineRoomResume = useCallback(() => {
    clearRoomSession();
    clearRoomState();
    setStatus('selector');
  }, [clearRoomState, setStatus]);

  const handleReturnToRoom = useCallback(() => {
    const savedSession = readRoomSession();
    if (room && roomCode) {
      const nextStatus = room.status === 'active'
        ? (room.mode === 'gauntlet' ? 'gauntlet' : 'assessment')
        : 'lobby';
      if (activeSocket && nextStatus === 'lobby') activeSocket.emit('set-player-presence', roomCode, 'in_lobby');
      setStatus(nextStatus);
      return;
    }
    if (!savedSession) { setStatus('selector'); return; }
    const { roomCode: savedRoomCode, username: savedUsername } = savedSession;
    if (!savedRoomCode || !savedUsername || !activeSocket) { setStatus('selector'); return; }
    setRoomCode(savedRoomCode);
    setUsername(savedUsername);
    rejoinRoom(savedRoomCode, savedUsername, (response: SocketAck) => {
      if (!response?.success || !response.room) { clearRoomSession(); clearRoomState(); setStatus('selector'); return; }
      const rejoinedRoom = response.room;
      if (rejoinedRoom.status === 'completed') {
        clearRoomSession();
        clearRoomState();
        setStatus('selector');
        return;
      }
      setRoom(rejoinedRoom);
      setKanaCards((rejoinedRoom.cards ?? []).filter(isStudyCard));
      const nextStatus = rejoinedRoom.status === 'active'
        ? (rejoinedRoom.mode === 'gauntlet' ? 'gauntlet' : 'assessment')
        : 'lobby';
      if (nextStatus === 'lobby') activeSocket.emit('set-player-presence', savedRoomCode, 'in_lobby');
      setStatus(nextStatus);
    }, { force: true });
  }, [activeSocket, clearRoomState, rejoinRoom, room, roomCode, setStatus]);

  const hasAssessmentData = (kanaCards.length > 0 || Boolean(room?.cards?.length))
    && Boolean(room?.players?.length);
  const isRestoringMatch = isHydratingActiveMatch || (status === 'assessment' && !hasAssessmentData);

  return useMemo(() => ({
    roomCode, room, username, kanaCards, results, grammarQuestions, prefillRoomCode,
    isPreparingAssessment, socket: activeSocket, isSocketReady,
    isHydratingActiveMatch,
    isRestoringMatch,
    handleCreateRoom: (deckOptions?: DeckOptions) => handleCreateRoom(getDisplayName(), deckOptions),
    handleJoinRoom: (code: string) => handleJoinRoom(code, getDisplayName()),
    handleReturnToRoom, handleDeclineRoomResume,
    isCurrentPlayerHost,
    handleInviteFriend,
    handleStartAssessment,
    handleStartGauntlet,
    handleReplayAssessment,
    handleRequestHost,
    handleSubmitAnswer,
    handleUseHint,
    handleForfeitMatch,
    handleReturnGauntletToLobby,
    handleNextCard,
    handleLeaveRoom,
    handleStartNewSession,
    handleGenerateCards,
    clearRoomState,
    setGrammarQuestions,
  }), [
    clearRoomState,
    grammarQuestions,
    handleCreateRoom,
    handleDeclineRoomResume,
    handleGenerateCards,
    handleJoinRoom,
    handleReturnToRoom,
    handleInviteFriend,
    handleLeaveRoom,
    handleNextCard,
    handleReplayAssessment,
    handleRequestHost,
    handleStartAssessment,
    handleStartGauntlet,
    handleStartNewSession,
    handleSubmitAnswer,
    handleUseHint,
    handleForfeitMatch,
    handleReturnGauntletToLobby,
    isPreparingAssessment,
    isHydratingActiveMatch,
    isRestoringMatch,
    isSocketReady,
    isCurrentPlayerHost,
    kanaCards,
    prefillRoomCode,
    results,
    room,
    roomCode,
    activeSocket,
    username,
  ]);
}