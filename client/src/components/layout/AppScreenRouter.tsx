import { lazy, Suspense } from 'react';
import { useAppContext, type AppContextValue } from '../../contexts/AppContext';
import { useRoomContext, type RoomContextValue } from '../../contexts/RoomContext';
import { isGrammarAnswer, isGrammarQuestion } from '../../types';
import { HomeSkeleton } from './AppHomeSkeleton';
import { GenericRouteSkeleton } from './GenericRouteSkeleton';

const AppHome = lazy(() => import('../AppHome'));
const RoomLobby = lazy(() => import('../practice/RoomLobby'));
const Assessment = lazy(() => import('../practice/Assessment'));
const Results = lazy(() => import('../practice/Results'));
const AuthPage = lazy(() => import('../auth/AuthPage'));
const KanjiStudy = lazy(() => import('../learning/KanjiStudy'));
const KanjiIntroScreen = lazy(() => import('../learning/KanjiIntroScreen'));
const VocabScreen = lazy(() => import('../learning/VocabScreen'));
const VocabIntroScreen = lazy(() => import('../learning/VocabIntroScreen'));
const KanaRecall = lazy(() => import('../learning/KanaRecall'));
const KanaIntro = lazy(() => import('../learning/KanaIntro'));
const KanaFilterScreen = lazy(() => import('../learning/KanaFilterScreen'));
const GrammarStudy = lazy(() => import('../learning/GrammarStudy'));
const AssessmentHistory = lazy(() => import('../learning/AssessmentHistory'));
const GrammarPractice = lazy(() => import('../practice/GrammarPractice'));
const AssessmentLoadingScreen = lazy(() => import('../learning/AssessmentLoadingScreen'));
const FriendsPanel = lazy(() => import('../social/FriendsPanel'));

type ScreenRouterProps = AppContextValue & RoomContextValue;

function LegacyAppScreenRouter({
  authLoading, authRequired, user, status, selectorScreen, appHomeKey, setSelectorScreen,
  handleCreateRoom, handleJoinRoom, handleOpenKanaStudy, handleOpenKanjiStudy, handleStartKanjiLearning,
  handleOpenVocabStudy, handleStartVocabLearning, handleOpenGrammarStudy, handleOpenGrammarPractice, handleReturnToRoom,
  handleDeclineRoomResume, prefillRoomCode, isSocketReady, roomCode, currentSessionKey,
  username, friends, friendSearchResults, isFriendSearchLoading, handleSearchUsers,
  handleRemoveFriend, handleGoBack, handleContinueKanaIntro, handleOpenKanaFilter,
  handleApplyKanaFilters, selectedKana, handleKanaReviewComplete, friendRequests,
  handleSendFriendRequest, handleAcceptFriendRequest, handleRejectFriendRequest,
  grammarQuestions, room, isPreparingAssessment, handleStartAssessment, handleLeaveRoom,
  socket, handleInviteFriend, handleNextCard, handleSubmitAnswer, kanaCards, handleUseHint,
  results, isCurrentPlayerHost, handleReplayAssessment, handleStartNewSession, handleRequestHost,
}: ScreenRouterProps) {
  // Server rooms carry the live session payload in `cards` (study cards for
  // kana/kanji decks, grammar questions otherwise); narrow it once here.
  const grammarSessionQuestions = (room?.cards ?? []).filter(isGrammarQuestion);
  // Player answers arrive untyped over the socket; project them onto the
  // grammar-room view model the practice screen consumes.
  const grammarRoomView = room
    ? {
      code: room.code,
      currentCardIndex: room.currentCardIndex,
      players: room.players.map((player) => ({
        name: player.name,
        userId: player.userId,
        ready: player.ready,
        answers: Array.isArray(player.answers) ? player.answers.filter(isGrammarAnswer) : [],
      })),
    }
    : null;

  return (
    <Suspense fallback={<GenericRouteSkeleton />}>
      {authLoading ? (
        status === 'selector' ? <HomeSkeleton /> : <GenericRouteSkeleton />
      ) : authRequired && !user ? (
        <AuthPage />
      ) : (
        <>
          {status === 'selector' && (
            <AppHome
              key={appHomeKey}
              screen={selectorScreen}
              onScreenChange={setSelectorScreen}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onOpenKanaStudy={handleOpenKanaStudy}
              onOpenKanjiStudy={handleOpenKanjiStudy}
              onOpenVocabStudy={handleOpenVocabStudy}
              onOpenGrammarStudy={handleOpenGrammarStudy}
              prefillRoomCode={prefillRoomCode}
              isSocketReady={isSocketReady}
              roomCode={roomCode}
            />
          )}

          {status === 'friends' && (
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

          {status === 'kanji-intro' && (
            <KanjiIntroScreen onBack={handleGoBack} onStartLearning={handleStartKanjiLearning} />
          )}

          {status === 'kanji-study' && <KanjiStudy onBack={handleGoBack} />}

          {status === 'vocab-intro' && (
            <VocabIntroScreen onBack={handleGoBack} onStartLearning={handleStartVocabLearning} />
          )}

          {status === 'vocab-study' && <VocabScreen onBack={handleGoBack} />}

          {status === 'grammar-study' && (
            <GrammarStudy
              onBack={handleGoBack}
              onPracticeLesson={(lessonNumber: number) =>
                handleOpenGrammarPractice(lessonNumber, 10)
              }
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
                questions={
                  grammarSessionQuestions.length ? grammarSessionQuestions : grammarQuestions
                }
                room={grammarRoomView}
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
              questions={
                grammarSessionQuestions.length ? grammarSessionQuestions : grammarQuestions
              }
              room={grammarRoomView}
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
    </Suspense>
  );
}

function AppScreenRouter() {
  const appContext = useAppContext();
  const roomContext = useRoomContext();
  return <LegacyAppScreenRouter {...appContext} {...roomContext} />;
}

export default AppScreenRouter;
