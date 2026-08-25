import { lazy, Suspense } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useRoomContext } from '../../contexts/RoomContext';

const AppHome = lazy(() => import('../AppHome'));
const RoomLobby = lazy(() => import('../practice/RoomLobby'));
const Assessment = lazy(() => import('../practice/Assessment'));
const Results = lazy(() => import('../practice/Results'));
const AuthPage = lazy(() => import('../auth/AuthPage'));
const KanjiStudy = lazy(() => import('../learning/KanjiStudy'));
const KanaRecall = lazy(() => import('../learning/KanaRecall'));
const KanaIntro = lazy(() => import('../learning/KanaIntro'));
const KanaFilterScreen = lazy(() => import('../learning/KanaFilterScreen'));
const GrammarStudy = lazy(() => import('../learning/GrammarStudy'));
const AssessmentHistory = lazy(() => import('../learning/AssessmentHistory'));
const GrammarPractice = lazy(() => import('../practice/GrammarPractice'));
const AssessmentLoadingScreen = lazy(() => import('../learning/AssessmentLoadingScreen'));
const FriendsPanel = lazy(() => import('../social/FriendsPanel'));

function LegacyAppScreenRouter({
  authLoading,
  authRequired,
  user,
  status,
  selectorScreen,
  appHomeKey,
  setSelectorScreen,
  handleCreateRoom,
  handleJoinRoom,
  handleOpenKanaStudy,
  handleOpenKanjiStudy,
  handleOpenGrammarStudy,
  handleOpenGrammarPractice,
  handleReturnToRoom,
  handleDeclineRoomResume,
  prefillRoomCode,
  isSocketReady,
  roomCode,
  currentSessionKey,
  username,
  friends,
  friendSearchResults,
  isFriendSearchLoading,
  handleSearchUsers,
  handleRemoveFriend,
  handleGoBack,
  handleContinueKanaIntro,
  handleOpenKanaFilter,
  handleApplyKanaFilters,
  selectedKana,
  handleKanaReviewComplete,
  friendRequests,
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  grammarQuestions,
  room,
  isPreparingAssessment,
  handleStartAssessment,
  handleLeaveRoom,
  socket,
  handleInviteFriend,
  handleNextCard,
  handleSubmitAnswer,
  kanaCards,
  handleUseHint,
  results,
  isCurrentPlayerHost,
  handleReplayAssessment,
  handleStartNewSession,
  handleRequestHost,
}) {
  return (
    <Suspense fallback={<main className="container mx-auto px-4 py-12 text-center text-muted-foreground">Loading...</main>}>
      <main className="container mx-auto px-4 py-6">
      {authLoading && <div className="py-12 text-center text-muted-foreground">Loading account...</div>}
      {!authLoading && authRequired && !user && <AuthPage />}
      {!authLoading && (!authRequired || user) && (
        <>
          {status === 'selector' && (
            <AppHome
              key={appHomeKey}
              screen={selectorScreen}
              onScreenChange={setSelectorScreen}
              onCreateRoom={(deckOptions) => handleCreateRoom(deckOptions)}
              onJoinRoom={(code) => handleJoinRoom(code)}
              onOpenKanaStudy={handleOpenKanaStudy}
              onOpenKanjiStudy={handleOpenKanjiStudy}
              onOpenGrammarStudy={handleOpenGrammarStudy}
              onOpenGrammarPractice={handleOpenGrammarPractice}
              onReturnToRoom={handleReturnToRoom}
              onDeclineRoomResume={handleDeclineRoomResume}
              prefillRoomCode={prefillRoomCode}
              isSocketReady={isSocketReady}
              roomCode={roomCode}
              resumeUsername={username}
              user={user}
              friends={friends}
              friendSearchResults={friendSearchResults}
              isFriendSearchLoading={isFriendSearchLoading}
              onSearchUsers={handleSearchUsers}
              onRemoveFriend={handleRemoveFriend}
            />
          )}

          {status === 'friends' && (
            <div className="space-y-4">
              <FriendsPanel
                friends={friends}
                searchResults={friendSearchResults}
                friendRequests={friendRequests}
                onSearchUsers={handleSearchUsers}
                onSendFriendRequest={handleSendFriendRequest}
                onAcceptFriendRequest={handleAcceptFriendRequest}
                onRejectFriendRequest={handleRejectFriendRequest}
                onRemoveFriend={handleRemoveFriend}
                isSearching={isFriendSearchLoading}
                onBack={handleGoBack}
              />
            </div>
          )}

          {status === 'kana-intro' && (
            <KanaIntro onBack={handleGoBack} onContinue={handleContinueKanaIntro} />
          )}

          {status === 'kana-filter' && (
            <KanaFilterScreen
              onBack={handleGoBack}
              onApplyFilters={handleApplyKanaFilters}
              initialSelectedKana={selectedKana}
            />
          )}

          {status === 'kana-study' && (
            <KanaRecall
              onBack={handleGoBack}
              onOpenFilter={handleOpenKanaFilter}
              onReviewComplete={handleKanaReviewComplete}
              selectedKana={selectedKana}
            />
          )}

          {status === 'kanji-study' && <KanjiStudy onBack={handleGoBack} />}

          {status === 'grammar-study' && (
            <GrammarStudy
              onBack={handleGoBack}
              onPracticeLesson={(lessonNumber) => handleOpenGrammarPractice(lessonNumber, 10)}
            />
          )}

          {status === 'grammar-practice' && (
            <GrammarPractice questions={grammarQuestions} onBack={handleGoBack} />
          )}

          {status === 'history' && <AssessmentHistory onBack={handleGoBack} />}

          {status === 'assessment-preparing' && room?.deckType === 'grammar' && (
            <AssessmentLoadingScreen
              title="Preparing the grammar deck"
              description="Generating the question set and getting both players ready."
              progress={12}
            />
          )}

          {status === 'lobby' && room && (
            <RoomLobby
              roomCode={roomCode}
              room={room}
              onStartAssessment={handleStartAssessment}
              onLeaveRoom={handleLeaveRoom}
              currentSocketId={socket?.id || ''}
              currentUserId={user?.id || null}
              currentSessionKey={currentSessionKey}
              isPreparingAssessment={isPreparingAssessment}
              friends={friends}
              onInviteFriend={handleInviteFriend}
            />
          )}

          {status === 'assessment' && room && (
            room.deckType === 'grammar' ? (
              <GrammarPractice
                questions={room.cards || grammarQuestions}
                room={room}
                username={username}
                onBack={handleGoBack}
                onNextCard={handleNextCard}
                onSubmitAnswer={handleSubmitAnswer}
              />
            ) : (
              <Assessment
                room={room}
                kanaCards={kanaCards}
                onSubmitAnswer={handleSubmitAnswer}
                onUseHint={handleUseHint}
                onNextCard={handleNextCard}
                username={username}
              />
            )
          )}

          {status === 'results' && results && room?.deckType === 'grammar' && (
            <GrammarPractice
              questions={room.cards || grammarQuestions}
              room={room}
              username={username}
              onBack={handleGoBack}
              onNextCard={handleNextCard}
              onSubmitAnswer={handleSubmitAnswer}
              forceShowResults
            />
          )}

          {status === 'results' && results && room?.deckType !== 'grammar' && (
            <Results
              results={results}
              roomCode={roomCode}
              kanaCards={kanaCards}
              username={username}
              user={user}
              room={room}
              isHost={isCurrentPlayerHost}
              onReplaySet={handleReplayAssessment}
              onStartNewSession={handleStartNewSession}
              onRequestHost={handleRequestHost}
            />
          )}
        </>
      )}
      </main>
    </Suspense>
  );
}

function AppScreenRouter() {
  const appContext = useAppContext();
  const roomContext = useRoomContext();

  return <LegacyAppScreenRouter {...appContext} {...roomContext} />;
}

export default AppScreenRouter;
