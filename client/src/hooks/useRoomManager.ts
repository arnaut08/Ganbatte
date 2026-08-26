import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Socket } from 'socket.io-client';
import { generateCards, getRoom } from '../services/api';
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
}: RoomManagerOptions) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [username, setUsername] = useState('');
  const [kanaCards, setKanaCards] = useState<StudyCard[]>([]);
  const [results, setResults] = useState<AssessmentResult[] | null>(null);
  const [prefillRoomCode, setPrefillRoomCode] = useState('');
  const [grammarQuestions, setGrammarQuestions] = useState<GrammarQuestion[]>([]);
  const [isPreparingAssessment, setIsPreparingAssessment] = useState(false);
  const { status, setStatus, setSelectorScreen, setScreenHistory, statusRef, transitionToStatus } = navigation;
  roomCodeRef.current = roomCode;
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
      type: deckOptions?.type === 'grammar' ? 'grammar' : deckOptions?.type === 'kanji' ? 'kanji' : 'kana',
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

  const { socket, isSocketReady } = useRoomSocket({
    authRequired, authLoading, user, status, roomCode, room, statusRef, getDisplayName,
    handleJoinRoom, transitionToStatus, refreshFriends, refreshFriendData, refreshFriendRequests,
    setRoomCode, setRoom, setUsername, setKanaCards, setResults, setPrefillRoomCode,
    setStatus, setScreenHistory, setIsPreparingAssessment, setToast,
  });
  const activeSocket = socket as unknown as Socket | null;
  socketRef.current = socket;

  useEffect(() => {
    const savedSession = readRoomSession();
    const savedRoomCode = (savedSession?.roomCode || '').trim().toUpperCase();
    if (savedRoomCode) setPrefillRoomCode(savedRoomCode);
  }, []);

  useEffect(() => {
    if (!room) return;
    if (room.status === 'preparing' && status !== 'assessment-preparing') {
      transitionToStatus('assessment-preparing');
      return;
    }
    if (room.status === 'active' && status === 'assessment-preparing') {
      setIsPreparingAssessment(false);
      transitionToStatus('assessment');
      return;
    }
    if (room.status === 'completed' && status !== 'results' && status !== 'lobby' && !results) {
      setIsPreparingAssessment(false);
      transitionToStatus('results');
    }
  }, [room, results, status, transitionToStatus]);

  useEffect(() => {
    if (room?.status !== 'completed' || !room.players?.length || results) return;
    setResults(room.players.map((player) => ({
      name: player.name,
      userId: player.userId ?? null,
      answers: player.answers ?? [],
      hintsUsed: player.hintsUsed || [],
    })));
    transitionToStatus('results');
  }, [room, results, transitionToStatus]);

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
    if (room.deckType === 'grammar') {
      setIsPreparingAssessment(true);
      transitionToStatus('assessment-preparing');
    }
    activeSocket.emit('start-assessment', roomCode);
  }, [activeSocket, isCurrentPlayerHost, room, roomCode, transitionToStatus]);

  const handleReplayAssessment = useCallback(() => {
    if (!activeSocket || !roomCode || !room) return;
    if (!isCurrentPlayerHost) {
      setToast({ message: 'Waiting for the host to replay this assessment.', type: 'warning' });
      return;
    }
    activeSocket.emit('replay-assessment', roomCode);
  }, [activeSocket, isCurrentPlayerHost, room, roomCode, setToast]);

  const handleRequestHost = useCallback((action: string) => {
    if (activeSocket && roomCode && room) activeSocket.emit('request-assessment-action', roomCode, action);
  }, [activeSocket, room, roomCode]);

  const handleSubmitAnswer = useCallback((answer: unknown) => {
    if (activeSocket && roomCode) activeSocket.emit('submit-answer', roomCode, answer);
  }, [activeSocket, roomCode]);

  const handleUseHint = useCallback((cardIndex: number) => {
    if (activeSocket && roomCode) activeSocket.emit('use-hint', roomCode, cardIndex);
  }, [activeSocket, roomCode]);

  const handleNextCard = useCallback(() => {
    if (activeSocket && roomCode) activeSocket.emit('player-ready', roomCode);
  }, [activeSocket, roomCode]);

  const handleLeaveRoom = useCallback(() => {
    if (!activeSocket || !roomCode) return;
    activeSocket.emit('leave-room', roomCode, (response: SocketAck) => {
      if (response?.success && username) {
        sessionStorage.setItem('ganbatte-room-session', JSON.stringify({ roomCode, username }));
      }
      setRoomCode(null);
      setRoom(null);
      setUsername('');
      setResults(null);
      setPrefillRoomCode('');
      setStatus('selector');
      setSelectorScreen('practice');
    });
  }, [activeSocket, roomCode, setSelectorScreen, setStatus, username]);

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
  }, [clearRoomSession, room, roomCode, setSelectorScreen, setStatus, activeSocket]);

  const clearRoomState = useCallback(() => {
    setRoomCode(null);
    setRoom(null);
    setUsername('');
    setResults(null);
    setPrefillRoomCode('');
  }, []);

  const handleDeclineRoomResume = useCallback(() => {
    clearRoomSession();
    clearRoomState();
    setStatus('selector');
  }, [clearRoomSession, clearRoomState, setStatus]);

  const handleReturnToRoom = useCallback(() => {
    const savedSession = readRoomSession();
    if (room && roomCode) {
      const nextStatus = room.status === 'active' ? 'assessment' : 'lobby';
      if (activeSocket && nextStatus === 'lobby') activeSocket.emit('set-player-presence', roomCode, 'in_lobby');
      setStatus(nextStatus);
      return;
    }
    if (!savedSession) { setStatus('selector'); return; }
    const { roomCode: savedRoomCode, username: savedUsername } = savedSession;
    if (!savedRoomCode || !savedUsername || !activeSocket) { setStatus('selector'); return; }
    setRoomCode(savedRoomCode);
    setUsername(savedUsername);
    activeSocket.emit('rejoin-room', savedRoomCode, savedUsername, getSessionKey(), user?.id, (response: SocketAck) => {
      if (!response?.success || !response.room) { clearRoomSession(); clearRoomState(); setStatus('selector'); return; }
      const rejoinedRoom = response.room;
      setRoom(rejoinedRoom);
      setKanaCards((rejoinedRoom.cards ?? []).filter(isStudyCard));
      const nextStatus = rejoinedRoom.status === 'active' ? 'assessment' : 'lobby';
      if (nextStatus === 'lobby') activeSocket.emit('set-player-presence', savedRoomCode, 'in_lobby');
      setStatus(nextStatus);
    });
  }, [activeSocket, clearRoomSession, clearRoomState, room, roomCode, setStatus, user?.id]);

  return useMemo(() => ({
    roomCode, room, username, kanaCards, results, grammarQuestions, prefillRoomCode,
    isPreparingAssessment, socket: activeSocket, isSocketReady,
    handleCreateRoom: (deckOptions?: DeckOptions) => handleCreateRoom(getDisplayName(), deckOptions),
    handleJoinRoom: (code: string) => handleJoinRoom(code, getDisplayName()),
    handleReturnToRoom, handleDeclineRoomResume,
    isCurrentPlayerHost,
    handleInviteFriend,
    handleStartAssessment,
    handleReplayAssessment,
    handleRequestHost,
    handleSubmitAnswer,
    handleUseHint,
    handleNextCard,
    handleLeaveRoom,
    handleStartNewSession,
    handleGenerateCards,
    setGrammarQuestions,
  }), [
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
    handleStartNewSession,
    handleSubmitAnswer,
    handleUseHint,
    isPreparingAssessment,
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
