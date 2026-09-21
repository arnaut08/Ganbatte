import { useState, useRef, useCallback, useMemo, Suspense } from 'react';
import type { Socket } from 'socket.io-client';
import AppHeader from './components/layout/AppHeader';
import AppToast from './components/layout/AppToast';
import AppScreenRouter from './components/layout/AppScreenRouter';
import AppShell from './components/layout/AppShell';
import './App.css';
import useAuth from './hooks/useAuth';
import useAccountActions from './hooks/useAccountActions';
import useToast from './hooks/useToast';
import type { ToastValue, UserProfileRecord } from './types';
import useRoomManager from './hooks/useRoomManager';
import useFriends from './hooks/useFriends';
import useAppNavigation from './hooks/useAppNavigation';
import { AppProvider } from './contexts/AppContext';
import { RoomProvider } from './contexts/RoomContext';
import { CelebrationProvider } from './contexts/CelebrationContext';
import UpdatePasswordPage from './components/auth/UpdatePasswordPage';

function App() {
  const [selectedKana, setSelectedKana] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<UserProfileRecord>();
  const { toast, showToast, clearToast } = useToast();
  const setToast = useCallback((nextToast: ToastValue) => {
    if (!nextToast) {
      clearToast();
      return;
    }
    showToast(nextToast.message, nextToast.type, nextToast.actions);
  }, [clearToast, showToast]);
  const { user, authLoading, authRequired, isPasswordRecovery, setIsPasswordRecovery, getDisplayName, handleLogout: signOut, isEmailVerifiedSignup, setIsEmailVerifiedSignup } = useAuth({ showToast });
  const socketRef = useRef<Socket | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const roomStatusRef = useRef<'lobby' | 'preparing' | 'active' | 'completed' | null>(null);
  const roomManagerRef = useRef<ReturnType<typeof useRoomManager> | null>(null);
  const navigation = useAppNavigation({
    socketRef,
    roomCodeRef,
    roomStatusRef,
    setGrammarQuestions: (questions) => roomManagerRef.current?.setGrammarQuestions(questions),
    setSelectedKana,
    showToast,
  });
  const {
    status,
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
    roomStatusRef,
  });
  roomManagerRef.current = roomManager;
  const {
    roomCode,
    room,
    username,
    kanaCards,
    results,
    grammarQuestions,
    prefillRoomCode,
    isPreparingAssessment,
    isRestoringMatch,
    socket,
    isSocketReady,
  } = roomManager;
  const { isLoggingOut, handleLogout, handleDeleteAccount } = useAccountActions({
    isMatchLocked: navigation.isMatchLocked,
    socket,
    clearRoomState: roomManager.clearRoomState,
    clearSocialDataCache: friendsState.clearSocialDataCache,
    onNavigateHome: navigation.handleBackToHome,
    signOut,
    showToast,
  });

  const appContextValue = useMemo(() => ({
    authLoading,
    isLoggingOut,
    authRequired,
    user,
    profile,
    onProfileSaved: setProfile,
    handleDeleteAccount,
    appHomeKey,
    status,
    getDisplayName,
    isEmailVerifiedSignup,
    setIsEmailVerifiedSignup,
    selectorScreen,
    setSelectorScreen,
    handleBackToPractice: navigation.handleBackToPractice,
    handleOpenFriends: navigation.handleOpenFriends,
    handleOpenProfile: navigation.handleOpenProfile,
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
  }), [authLoading, authRequired, appHomeKey, handleDeleteAccount, isLoggingOut, navigation, profile, selectedKana, selectorScreen, status, user, isEmailVerifiedSignup, setIsEmailVerifiedSignup]);

  const roomContextValue = useMemo(() => ({
    socket,
    isSocketReady,
    room,
    roomCode: roomCode || '',
    username,
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
    handleStartGauntlet: roomManager.handleStartGauntlet,
    handleStartTugOfWar: roomManager.handleStartTugOfWar,
    handleReturnGauntletToLobby: roomManager.handleReturnGauntletToLobby,
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
      <Suspense fallback={<div className="flex min-h-[100dvh] items-center justify-center bg-[#11141d] font-mono text-white">Loading Protocol...</div>}>
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
    <div className="app-container">
      <CelebrationProvider>
        <AppToast
          toast={toast}
          onAction={(action) => {
            action.onClick();
            clearToast();
          }}
        />

        <AppShell
          showHeader={!isRestoringMatch}
          header={(
            <AppHeader
              onHome={navigation.handleBackToHome}
              onOpenFriends={navigation.handleOpenFriends}
              onOpenProfile={navigation.handleOpenProfile}
              onProfileLoaded={setProfile}
              onLogout={handleLogout}
              onOpenHistory={navigation.handleOpenHistory}
              onOpenPassport={navigation.handleOpenPassport}
              isAuthenticated={Boolean(user)}
              user={user}
              pendingFriendRequestCount={friendsState.friendRequests.filter((request) => request?.direction !== 'outgoing').length}
            />
          )}
        >
          <AppProvider value={appContextValue}>
            <RoomProvider value={roomContextValue}>
              <AppScreenRouter />
            </RoomProvider>
          </AppProvider>
        </AppShell>
      </CelebrationProvider>
    </div>
  );
}

export default App;
