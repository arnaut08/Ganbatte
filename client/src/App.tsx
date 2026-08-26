import { useState, useRef, useCallback, useMemo } from 'react';
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

function App() {
  const [selectedKana, setSelectedKana] = useState<Set<string>>(new Set());
  const { user, authLoading, authRequired, getDisplayName, handleLogout: signOut } = useAuth();
  const { toast, showToast, clearToast } = useToast();
  const setToast = useCallback((nextToast: ToastValue) => {
    if (!nextToast) {
      clearToast();
      return;
    }
    showToast(nextToast.message, nextToast.type, nextToast.actions);
  }, [clearToast, showToast]);
  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const roomManagerRef = useRef<ReturnType<typeof useRoomManager> | null>(null);
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

  const handleLogout = async () => {
    if (socket) {
      socket.disconnect();
    }

    clearRoomSession();
    friendsState.clearSocialDataCache();
    sessionStorage.removeItem('ganbatte-session-key');
    roomManager.handleDeclineRoomResume();
    setStatus('selector');
    setSelectorScreen('home');

    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const appContextValue = useMemo(() => ({
    authLoading,
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
    handleOpenGrammarStudy: navigation.handleOpenGrammarStudy,
    handleOpenGrammarPractice: navigation.handleOpenGrammarPractice,
    selectedKana,
    handleContinueKanaIntro: navigation.handleContinueKanaIntro,
    handleOpenKanaFilter: navigation.handleOpenKanaFilter,
    handleApplyKanaFilters: navigation.handleApplyKanaFilters,
    handleKanaReviewComplete: navigation.handleKanaReviewComplete,
  }), [authLoading, authRequired, appHomeKey, navigation, selectedKana, selectorScreen, status, user]);

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
    handleReplayAssessment: roomManager.handleReplayAssessment,
    handleStartNewSession: roomManager.handleStartNewSession,
    handleRequestHost: roomManager.handleRequestHost,
    isCurrentPlayerHost: roomManager.isCurrentPlayerHost,
  }), [friendsState, grammarQuestions, roomManager, isPreparingAssessment, isSocketReady,
    kanaCards, prefillRoomCode, results, room, roomCode, socket, username]);

  return (
    <div className="app-container min-h-screen">
      <AppToast
        toast={toast}
        onAction={(action) => {
          action.onClick();
          clearToast();
        }}
      />

      <AppHeader
        onHome={navigation.handleBackToPractice}
        onOpenFriends={navigation.handleOpenFriends}
        onLogout={handleLogout}
        onOpenHistory={navigation.handleOpenHistory}
        isAuthenticated={Boolean(user)}
        user={user}
        pendingFriendRequestCount={friendsState.friendRequests.filter((request) => request?.direction !== 'outgoing').length}
      />

      <AppProvider value={appContextValue}>
        <RoomProvider value={roomContextValue}>
          <AppScreenRouter />
        </RoomProvider>
      </AppProvider>
    </div>
  );
}

export default App;
