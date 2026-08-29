import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import { generateGrammarAssessment } from '../services/api';
import type { AppStatus, GrammarQuestion, SelectorScreen, ToastType } from '../types';
import { ROOM_VIEW_STATUSES as roomStatuses } from '../types';
import { pushScreenHistory } from '../utils/navigation';

const screenPriority: Record<AppStatus, number> = {
  selector: 0, friends: 0, 'kana-intro': 0, 'kana-filter': 0, 'kana-study': 0,
  'kanji-intro': 0,
  'kanji-study': 0, 'vocab-intro': 0, 'vocab-study': 0, 'grammar-study': 0, 'grammar-practice': 0, history: 0,
  lobby: 0, assessment: 1, results: 1, 'assessment-preparing': 0,
};

type NavigationOptions = {
  socketRef: MutableRefObject<Socket | null>;
  roomCodeRef: MutableRefObject<string | null>;
  setGrammarQuestions: Dispatch<SetStateAction<GrammarQuestion[]>>;
  setSelectedKana: Dispatch<SetStateAction<Set<string>>>;
  showToast: (message: string, type?: ToastType) => void;
};

export default function useAppNavigation({ socketRef, roomCodeRef, setGrammarQuestions, setSelectedKana, showToast }: NavigationOptions) {
  const [status, setStatus] = useState<AppStatus>('selector');
  const [selectorScreen, setSelectorScreen] = useState<SelectorScreen>('home');
  const [screenHistory, setScreenHistory] = useState<AppStatus[]>(['selector']);
  const [appHomeKey, setAppHomeKey] = useState(0);
  const statusRef = useRef(status);

  useEffect(() => { statusRef.current = status; }, [status]);

  const transitionToStatus = useCallback((nextStatus: AppStatus) => {
    setStatus((current) => {
      if (!nextStatus || (screenPriority[nextStatus] ?? 0) < (screenPriority[current] ?? 0)) return current;
      if (!roomStatuses.includes(current) && current !== 'selector' && roomStatuses.includes(nextStatus)) return current;
      return nextStatus;
    });
  }, []);

  const navigateToScreen = useCallback((nextStatus: AppStatus) => {
    if (!nextStatus) return;
    const socket = socketRef.current;
    const roomCode = roomCodeRef.current;
    if (socket?.connected && roomCode) {
      socket.emit('set-player-presence', roomCode, nextStatus === 'lobby' ? 'in_lobby' : 'away');
    }
    setScreenHistory((history) => pushScreenHistory(history, statusRef.current, nextStatus) as AppStatus[]);
    setStatus(nextStatus);
  }, [roomCodeRef, socketRef]);

  const handleGoBack = useCallback(() => {
    setScreenHistory((history) => {
      const safeHistory: AppStatus[] = history.length ? history : ['selector'];
      const nextHistory: AppStatus[] = safeHistory.length > 1 ? safeHistory.slice(0, -1) : ['selector'];
      const previousStatus = (nextHistory[nextHistory.length - 1] || 'selector') as AppStatus;
      const socket = socketRef.current;
      const roomCode = roomCodeRef.current;
      if (socket?.connected && roomCode) socket.emit('set-player-presence', roomCode, previousStatus === 'lobby' ? 'in_lobby' : 'away');
      setStatus(previousStatus);
      return nextHistory;
    });
  }, [roomCodeRef, socketRef]);

  const handleBackToPractice = useCallback(() => {
    setStatus('selector');
    setSelectorScreen('home');
    setScreenHistory(['selector']);
    setAppHomeKey((value) => value + 1);
  }, []);

  const handleOpenGrammarPractice = useCallback(async (maxLesson = 12, count = 10, mode = 'practice') => {
    try {
      const response = await generateGrammarAssessment(maxLesson, count, mode);
      const questions = Array.isArray(response?.questions) ? response.questions : [];
      if (!questions.length) return showToast('No grammar questions were generated.', 'warning');
      setGrammarQuestions(questions);
      navigateToScreen('grammar-practice');
    } catch (error: unknown) {
      console.error('Failed to generate grammar assessment:', error);
      showToast(error instanceof Error ? error.message : 'Unable to generate grammar assessment.', 'error');
    }
  }, [navigateToScreen, setGrammarQuestions, showToast]);

  return useMemo(() => ({
    status, setStatus, selectorScreen, setSelectorScreen, screenHistory, setScreenHistory,
    appHomeKey, statusRef, transitionToStatus, navigateToScreen,
    handleGoBack, handleBackToPractice,
    handleOpenKanaStudy: () => navigateToScreen('kana-intro'),
    handleContinueKanaIntro: () => navigateToScreen('kana-filter'),
    handleOpenKanaFilter: () => navigateToScreen('kana-filter'),
    handleApplyKanaFilters: (selectedKana: Set<string>) => { setSelectedKana(selectedKana); navigateToScreen('kana-study'); },
    handleKanaReviewComplete: () => navigateToScreen('kana-intro'),
    handleOpenKanjiStudy: () => navigateToScreen('kanji-intro'),
    handleStartKanjiLearning: () => navigateToScreen('kanji-study'),
    handleOpenVocabStudy: () => navigateToScreen('vocab-intro'),
    handleStartVocabLearning: () => navigateToScreen('vocab-study'),
    handleOpenGrammarStudy: () => navigateToScreen('grammar-study'),
    handleOpenGrammarPractice,
    handleOpenHistory: () => navigateToScreen('history'),
    handleOpenFriends: () => navigateToScreen('friends'),
  }), [
    appHomeKey,
    handleBackToPractice,
    handleGoBack,
    handleOpenGrammarPractice,
    navigateToScreen,
    screenHistory,
    selectorScreen,
    status,
    statusRef,
    transitionToStatus,
  ]);
}
