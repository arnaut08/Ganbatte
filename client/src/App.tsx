import { useState, useRef, useCallback, useMemo, useEffect, Suspense } from 'react';
import type { MutableRefObject } from 'react';
import type { Socket } from 'socket.io-client';
import AppHeader from './components/layout/AppHeader';
import AppToast from './components/layout/AppToast';
import AppScreenRouter from './components/layout/AppScreenRouter';
import './App.css';
import {
  clearRoomSession,
  getSessionKey,
  readRoomSession,
} from './utils/roomSession';
import useAuth from './hooks/useAuth';
import useToast from './hooks/useToast';
import type { ToastValue } from './types';
import useRoomManager from './hooks/useRoomManager';
import useFriends from './hooks/useFriends';
import useAppNavigation from './hooks/useAppNavigation';
import { AppProvider } from './contexts/AppContext';
import { RoomProvider } from './contexts/RoomContext';
import { CelebrationProvider } from './contexts/CelebrationContext';
import UpdatePasswordPage from './components/auth/UpdatePasswordPage';

function App() {
  const [selectedKana, setSelectedKana] = useState<Set<string>>(new Set());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast, showToast, clearToast } = useToast();
  const setToast = useCallback((nextToast: ToastValue) => {
    if (!nextToast) {
      clearToast();
      return;
    }
    showToast(nextToast.message, nextToast.type, nextToast.actions);
  }, [clearToast, showToast]);
  const { user, authLoading, authRequired, isPasswordRecovery, setIsPasswordRecovery, getDisplayName, handleLogout: signOut } = useAuth({ showToast });
  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const roomManagerRef = useRef<ReturnType<typeof useRoomManager> | null>(null);

  useEffect(() => {
    if (!user) setIsLoggingOut(false);
  }, [user]);
  const navigation = useAppNavigation({
    socketRef,
    roomCodeRef,
    setGrammarQuestions: (questions) => roomManagerRef.current?.setGrammarQuestions(questions),
    setSelectedKana,
    showToast,
  });
  const {
    status,
    setStatus,
    selectorScreen,
    setSelectorScreen,
    appHomeKey,
  } = navigation;
  const isMatchLocked = status === 'assessment' || status === 'assessment-preparing';

  const friendsState = useFriends({ user, status, showToast });

  const roomManager = useRoomManager({
    authRequired,
    authLoading,
    user,
    setToast,
    navigation: { ...navigation, getDisplayName },
    refreshFriends: friendsState.refreshFriends,
    refreshFriendData: friendsState.refreshFriendData,
    refreshFriendRequests: friendsState.refreshFriendRequests,
    socketRef,
    roomCodeRef,
  });
  roomManagerRef.current = roomManager;
  const { roomCode, room, username, kanaCards, results, grammarQuestions, prefillRoomCode, isPreparingAssessment, socket, isSocketReady } = roomManager;
  const hasAssessmentData = (kanaCards.length > 0 || Boolean(room?.cards?.length))
    && Boolean(room?.players?.length);
  const isRestoringMatch = roomManager.isHydratingActiveMatch || (status === 'assessment' && !hasAssessmentData);

  const handleLogout = async () => {
    if (isMatchLocked) {
      showToast('Cannot sign out during an active match. Finish or forfeit first.', 'error');
      return;
    }
    setIsLoggingOut(true);
    setStatus('selector');
    setSelectorScreen('home');

    if (socket) {
      socket.disconnect();
    }

    clearRoomSession();
    friendsState.clearSocialDataCache();
    localStorage.removeItem('ganbatte-session-key');
    roomManager.clearRoomState();

    try {
      await signOut();
    } catch (error) {
      setIsLoggingOut(false);
      console.error('Logout failed:', error);
    }
  };

  const handleHomeNavigation = () => {
    if (isMatchLocked) {
      showToast('Cannot leave during an active match. Finish or forfeit first.', 'error');
      return;
    }
    navigation.handleBackToPractice();
  };

  const appContextValue = useMemo(() => ({
    authLoading,
    isLoggingOut,
    authRequired,
    user,
    appHomeKey,
    status,
    selectorScreen,
    setSelectorScreen,
    handleBackToPractice: navigation.handleBackToPractice,
    handleOpenFriends: navigation.handleOpenFriends,
    handleOpenHistory: navigation.handleOpenHistory,
    handleGoBack: navigation.handleGoBack,
    handleOpenKanaStudy: navigation.handleOpenKanaStudy,
    handleOpenKanjiStudy: navigation.handleOpenKanjiStudy,
    handleStartKanjiLearning: navigation.handleStartKanjiLearning,
    handleOpenVocabStudy: navigation.handleOpenVocabStudy,
    handleStartVocabLearning: navigation.handleStartVocabLearning,
    handleOpenGrammarStudy: navigation.handleOpenGrammarStudy,
    handleStartGrammarStudy: navigation.handleStartGrammarStudy,
    handleStartGrammarPractice: navigation.handleStartGrammarPractice,
    handleOpenGrammarPractice: navigation.handleOpenGrammarPractice,
    selectedKana,
    handleContinueKanaIntro: navigation.handleContinueKanaIntro,
    handleOpenKanaFilter: navigation.handleOpenKanaFilter,
    handleKanaSelectionChange: navigation.handleKanaSelectionChange,
    handleApplyKanaFilters: navigation.handleApplyKanaFilters,
  }), [authLoading, authRequired, appHomeKey, isLoggingOut, navigation, selectedKana, selectorScreen, status, user]);

  const roomContextValue = useMemo(() => ({
    socket,
    isSocketReady,
    room,
    roomCode: roomCode || readRoomSession()?.roomCode || '',
    currentSessionKey: getSessionKey(),
    username: readRoomSession()?.username || username,
    kanaCards,
    results,
    grammarQuestions,
    prefillRoomCode,
    friends: friendsState.friends,
    friendRequests: friendsState.friendRequests,
    friendSearchResults: friendsState.friendSearchResults,
    isFriendSearchLoading: friendsState.isFriendSearchLoading,
    isPreparingAssessment,
    isHydratingActiveMatch: roomManager.isHydratingActiveMatch,
    handleCreateRoom: roomManager.handleCreateRoom,
    handleJoinRoom: roomManager.handleJoinRoom,
    handleReturnToRoom: roomManager.handleReturnToRoom,
    handleDeclineRoomResume: roomManager.handleDeclineRoomResume,
    handleSearchUsers: friendsState.handleSearchUsers,
    handleRemoveFriend: friendsState.handleRemoveFriend,
    handleSendFriendRequest: friendsState.handleSendFriendRequest,
    handleAcceptFriendRequest: friendsState.handleAcceptFriendRequest,
    handleRejectFriendRequest: friendsState.handleRejectFriendRequest,
    handleStartAssessment: roomManager.handleStartAssessment,
    handleLeaveRoom: roomManager.handleLeaveRoom,
    handleInviteFriend: roomManager.handleInviteFriend,
    handleNextCard: roomManager.handleNextCard,
    handleSubmitAnswer: roomManager.handleSubmitAnswer,
    handleUseHint: roomManager.handleUseHint,
    handleForfeitMatch: roomManager.handleForfeitMatch,
    handleReplayAssessment: roomManager.handleReplayAssessment,
    handleStartNewSession: roomManager.handleStartNewSession,
    handleRequestHost: roomManager.handleRequestHost,
    isCurrentPlayerHost: roomManager.isCurrentPlayerHost,
  }), [friendsState, grammarQuestions, roomManager, isPreparingAssessment, isSocketReady,
    kanaCards, prefillRoomCode, results, room, roomCode, socket, username]);

  // Force password update screen if in recovery mode
  if (isPasswordRecovery) {
    return (
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-mono text-white bg-[#11141d]">Loading Protocol...</div>}>
        <UpdatePasswordPage
          showToast={showToast}
          onSuccess={() => {
            setIsPasswordRecovery(false);
            window.location.hash = '';
            window.location.reload();
          }}
        />
      </Suspense>
    );
  }
  
  return (
    <div className="app-container min-h-screen">
      <CelebrationProvider>
        <AppToast
          toast={toast}
          onAction={(action) => {
            action.onClick();
            clearToast();
          }}
        />

        {!isRestoringMatch && (
          <AppHeader
            onHome={handleHomeNavigation}
            onOpenFriends={navigation.handleOpenFriends}
            onLogout={handleLogout}
            onOpenHistory={navigation.handleOpenHistory}
            onOpenPassport={navigation.handleOpenPassport}
            isAuthenticated={Boolean(user)}
            user={user}
            pendingFriendRequestCount={friendsState.friendRequests.filter((request) => request?.direction !== 'outgoing').length}
          />
        )}

        <AppProvider value={appContextValue}>
          <RoomProvider value={roomContextValue}>
            <AppScreenRouter />
          </RoomProvider>
        </AppProvider>
      </CelebrationProvider>
    </div>
  );
}

export default App;
