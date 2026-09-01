import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import { generateGrammarAssessment } from '../services/api';
import type { AppStatus, GrammarQuestion, SelectorScreen, ToastType } from '../types';
import { ROOM_VIEW_STATUSES as roomStatuses } from '../types';
import { getBackDestination } from '../utils/navigation';

const screenPriority: Record<AppStatus, number> = {
  selector: 0,
  friends: 0,
  passport: 0,
  'kana-intro': 0,
  'kana-filter': 0,
  'kana-study': 0,
  'kanji-intro': 0,
  'kanji-study': 0,
  'vocab-intro': 0,
  'vocab-study': 0,
  'grammar-intro': 0,
  'grammar-study': 0,
  'grammar-practice': 0,
  history: 0,
  lobby: 0,
  assessment: 1,
  results: 1,
  'assessment-preparing': 0,
};

type NavigationOptions = {
  socketRef: MutableRefObject<Socket | null>;
  roomCodeRef: MutableRefObject<string | null>;
  roomStatus?: 'lobby' | 'preparing' | 'active' | 'completed' | null;
  setGrammarQuestions: Dispatch<SetStateAction<GrammarQuestion[]>>;
  setSelectedKana: Dispatch<SetStateAction<Set<string>>>;
  showToast: (message: string, type?: ToastType) => void;
};

export default function useAppNavigation({
  socketRef,
  roomCodeRef,
  roomStatus,
  setGrammarQuestions,
  setSelectedKana,
  showToast,
}: NavigationOptions) {
  const [status, setStatus] = useState<AppStatus>('selector');
  const [selectorScreen, setSelectorScreen] = useState<SelectorScreen>('home');
  const [appHomeKey, setAppHomeKey] = useState(0);
  const [screenHistory, setScreenHistory] = useState<AppStatus[]>(['selector']);

  const statusRef = useRef(status);
  const selectorScreenRef = useRef(selectorScreen);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    selectorScreenRef.current = selectorScreen;
  }, [selectorScreen]);

  // Synchronize presence and push history whenever transitionToStatus executes
  const transitionToStatus = useCallback((nextStatus: AppStatus) => {
    setStatus((current) => {
      if (!nextStatus || (screenPriority[nextStatus] ?? 0) < (screenPriority[current] ?? 0)) {
        return current;
      }
      if (!roomStatuses.includes(current) && current !== 'selector' && roomStatuses.includes(nextStatus)) {
        return current;
      }

      setScreenHistory((prev) => (prev[prev.length - 1] === nextStatus ? prev : [...prev, nextStatus]));
      return nextStatus;
    });
  }, []);

  const navigateToScreen = useCallback(
    (nextStatus: AppStatus, targetSelector?: SelectorScreen) => {
      if (!nextStatus) return;

      if (statusRef.current === 'assessment' || statusRef.current === 'assessment-preparing') {
        showToast('Cannot navigate away during an active match. Finish or forfeit first.', 'error');
        return;
      }

      const socket = socketRef.current;
      const roomCode = roomCodeRef.current;
      if (socket?.connected && roomCode) {
        socket.emit('set-player-presence', roomCode, nextStatus === 'lobby' ? 'in_lobby' : 'away');
      }

      if (targetSelector) {
        setSelectorScreen(targetSelector);
      }

      setScreenHistory((prev) => (prev[prev.length - 1] === nextStatus ? prev : [...prev, nextStatus]));
      setStatus(nextStatus);
    },
    [roomCodeRef, showToast, socketRef]
  );

  const handleGoBack = useCallback(() => {
    if (statusRef.current === 'assessment' || statusRef.current === 'assessment-preparing') {
      showToast('Cannot navigate away during an active match. Finish or forfeit first.', 'error');
      return;
    }
    const destination = getBackDestination({
      currentStatus: statusRef.current,
      selectorScreen: selectorScreenRef.current,
      activeRoomCode: roomCodeRef.current,
      roomStatus,
    });

    const socket = socketRef.current;
    const roomCode = roomCodeRef.current;
    if (socket?.connected && roomCode) {
      socket.emit('set-player-presence', roomCode, destination.nextStatus === 'lobby' ? 'in_lobby' : 'away');
    }

    if (destination.nextSelectorScreen) {
      setSelectorScreen(destination.nextSelectorScreen);
    }

    setScreenHistory((prev) => {
      const nextHistory: AppStatus[] = prev.length > 1 ? prev.slice(0, -1) : ['selector'];
      return nextHistory[nextHistory.length - 1] === destination.nextStatus
        ? nextHistory
        : [...nextHistory, destination.nextStatus];
    });

    setStatus(destination.nextStatus);
  }, [roomCodeRef, roomStatus, socketRef]);

  const handleBackToPractice = useCallback(() => {
    if (statusRef.current === 'assessment' || statusRef.current === 'assessment-preparing') {
      showToast('Cannot navigate away during an active match. Finish or forfeit first.', 'error');
      return;
    }
    setStatus('selector');
    setSelectorScreen('practice');
    setScreenHistory(['selector']);
    setAppHomeKey((value) => value + 1);
  }, [showToast]);

  const handleOpenGrammarPractice = useCallback(
    async (maxLesson = 12, count = 10, mode = 'practice') => {
      try {
        const response = await generateGrammarAssessment(maxLesson, count, mode);
        const questions = Array.isArray(response?.questions) ? response.questions : [];
        if (!questions.length) {
          return showToast('No grammar questions were generated.', 'warning');
        }
        setGrammarQuestions(questions);
        navigateToScreen('grammar-practice');
      } catch (error: unknown) {
        console.error('Failed to generate grammar assessment:', error);
        showToast(error instanceof Error ? error.message : 'Unable to generate grammar assessment.', 'error');
      }
    },
    [navigateToScreen, setGrammarQuestions, showToast]
  );

  return useMemo(
    () => ({
      status,
      setStatus,
      screenHistory,
      setScreenHistory,
      selectorScreen,
      setSelectorScreen,
      appHomeKey,
      statusRef,
      transitionToStatus,
      navigateToScreen,
      handleGoBack,
      handleBackToPractice,

      // Navigation Actions
      handleOpenKanaStudy: () => navigateToScreen('kana-intro'),
      handleContinueKanaIntro: () => navigateToScreen('kana-filter'),
      handleOpenKanaFilter: () => navigateToScreen('kana-filter'),
      handleKanaSelectionChange: (cells: Set<string>) => setSelectedKana(new Set(cells)),
      handleApplyKanaFilters: (selectedKana: Set<string>) => {
        setSelectedKana(selectedKana);
        navigateToScreen('kana-study');
      },
      handleOpenKanjiStudy: () => navigateToScreen('kanji-intro'),
      handleStartKanjiLearning: () => navigateToScreen('kanji-study'),
      handleOpenVocabStudy: () => navigateToScreen('vocab-intro'),
      handleStartVocabLearning: () => navigateToScreen('vocab-study'),
      handleOpenGrammarStudy: () => navigateToScreen('grammar-intro'),
      handleStartGrammarStudy: () => navigateToScreen('grammar-study'),
      handleStartGrammarPractice: (maxLesson = 12, count = 10) =>
        handleOpenGrammarPractice(maxLesson, count, 'practice'),
      handleOpenGrammarPractice,
      handleOpenHistory: () => navigateToScreen('history'),
      handleOpenFriends: () => navigateToScreen('friends'),
      handleOpenPassport: () => navigateToScreen('passport'),
    }),
    [
      appHomeKey,
      handleBackToPractice,
      handleGoBack,
      handleOpenGrammarPractice,
      navigateToScreen,
      screenHistory,
      selectorScreen,
      setSelectedKana,
      status,
      transitionToStatus,
    ]
  );
}