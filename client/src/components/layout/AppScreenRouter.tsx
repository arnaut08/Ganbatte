import { lazy, Suspense, useState, useCallback } from 'react';
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
const KanjiStudy = lazy(() => import('../learning/kanji/KanjiStudy'));
const KanjiIntroScreen = lazy(() => import('../learning/kanji/KanjiIntroScreen'));
const VocabScreen = lazy(() => import('../learning/vocab/VocabScreen'));
const VocabIntroScreen = lazy(() => import('../learning/vocab/VocabIntroScreen'));
const KanaRecall = lazy(() => import('../learning/kana/KanaRecall'));
const KanaIntro = lazy(() => import('../learning/kana/KanaIntro'));
const KanaFilterScreen = lazy(() => import('../learning/kana/KanaFilterScreen'));
const GrammarStudy = lazy(() => import('../learning/grammar/GrammarStudy'));
const GrammarIntroScreen = lazy(() => import('../learning/grammar/GrammarIntroScreen'));
const AssessmentHistory = lazy(() => import('../profile/AssessmentHistory'));
const GrammarPractice = lazy(() => import('../practice/GrammarPractice'));
const AssessmentLoadingScreen = lazy(() => import('../practice/AssessmentLoadingScreen'));
const FriendsPanel = lazy(() => import('../social/FriendsPanel'));
const MasteryPassportScreen = lazy(() => import('../profile/MasteryPassportScreen'));

type ScreenRouterProps = AppContextValue & RoomContextValue;

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
  handleStartKanjiLearning,
  handleOpenVocabStudy,
  handleStartVocabLearning,
  handleOpenGrammarStudy,
  handleStartGrammarStudy,
  handleStartGrammarPractice,
  handleOpenGrammarPractice,
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
  handleKanaSelectionChange,
  selectedKana,
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
  handleOpenHistory,
}: ScreenRouterProps) {
  // Hold screen while AuthPage stamp animation runs
  const [isStampAnimating, setIsStampAnimating] = useState(false);

  const handleAuthSuccess = useCallback(() => {
    setIsStampAnimating(false);
  }, []);

  const handleStartAuthAnimation = useCallback(() => {
    setIsStampAnimating(true);
  }, []);

  const grammarSessionQuestions = (room?.cards ?? []).filter(isGrammarQuestion);
  const grammarRoomView = room
    ? {
      code: room.code,
      currentCardIndex: room.currentCardIndex,
      players: (room.players || []).map((player) => ({
        name: player.name,
        userId: player.userId,
        ready: player.ready,
        answers: Array.isArray(player.answers) ? player.answers.filter(isGrammarAnswer) : [],
      })),
    }
    : null;

  const hasValidResults = Array.isArray(results) && results.length > 0;
  const isResultsScreen = status === 'results';

  const shouldRenderRoomLobby = status === 'lobby' && Boolean(room);
  const shouldRenderAssessment = status === 'assessment' && Boolean(room);
  const shouldRenderPreparing = status === 'assessment-preparing';
  const shouldRenderResults = isResultsScreen && hasValidResults;

  const isOtherKnownScreen = [
    'friends',
    'kana-intro',
    'kana-filter',
    'kana-study',
    'kanji-intro',
    'kanji-study',
    'vocab-intro',
    'vocab-study',
    'grammar-intro',
    'grammar-study',
    'grammar-practice',
    'history',
    'passport',
  ].includes(status);

  const shouldRenderHome =
    status === 'selector' ||
    (!isOtherKnownScreen &&
      !shouldRenderRoomLobby &&
      !shouldRenderAssessment &&
      !shouldRenderPreparing &&
      !shouldRenderResults);

  const activeCards = (kanaCards && kanaCards.length > 0) ? kanaCards : (room?.cards ?? []);

  // Show AuthPage if auth is required AND (no user OR stamp animation is still playing)
  const shouldShowAuth = (authRequired && !user) || isStampAnimating;

  return (
    <Suspense fallback={<GenericRouteSkeleton status={status} />}>
      {authLoading ? (
        status === 'selector' ? <HomeSkeleton /> : <GenericRouteSkeleton status={status} />
      ) : shouldShowAuth ? (
        <AuthPage
          onStartSuccessAnimation={handleStartAuthAnimation}
          onSuccessComplete={handleAuthSuccess}
        />
      ) : (
        <>
          {shouldRenderHome && (
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
              onSelectionChange={handleKanaSelectionChange}
              initialSelectedKana={selectedKana}
            />
          )}

          {status === 'kana-study' && (
            <KanaRecall
              onBack={handleGoBack}
              onOpenFilter={handleOpenKanaFilter}
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

          {status === 'grammar-intro' && (
            <GrammarIntroScreen
              onBack={handleGoBack}
              onStartLearning={handleStartGrammarStudy}
            />
          )}

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

          {status === 'passport' && (
            <MasteryPassportScreen
              onBack={handleGoBack}
              onOpenKanaStudy={handleOpenKanaStudy}
              onOpenKanjiStudy={handleOpenKanjiStudy}
              onOpenVocabStudy={handleOpenVocabStudy}
              onOpenGrammarStudy={handleOpenGrammarStudy}
              onOpenHistory={handleOpenHistory}
            />
          )}

          {shouldRenderPreparing && (
            <AssessmentLoadingScreen
              title={
                room?.deckType === 'grammar'
                  ? 'Preparing the grammar deck'
                  : room?.deckType === 'kanji'
                    ? 'Preparing the kanji drill'
                    : 'Preparing the reading deck'
              }
              description="Generating the question set and synchronizing operators..."
            />
          )}

          {shouldRenderRoomLobby && room && (
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

          {shouldRenderAssessment && room && (
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
                kanaCards={activeCards}
                onSubmitAnswer={handleSubmitAnswer}
                onUseHint={handleUseHint}
                onNextCard={handleNextCard}
                username={username}
              />
            )
          )}

          {shouldRenderResults && (
            room?.deckType === 'grammar' ? (
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
            ) : (
              <Results
                results={results}
                roomCode={roomCode}
                kanaCards={activeCards}
                username={username}
                user={user}
                room={room}
                isHost={isCurrentPlayerHost}
                onReplaySet={handleReplayAssessment}
                onStartNewSession={handleStartNewSession}
                onRequestHost={handleRequestHost}
              />
            )
          )}
        </>
      )}
    </Suspense>
  );
}

export default function AppScreenRouter() {
  const appContext = useAppContext();
  const roomContext = useRoomContext();
  return <LegacyAppScreenRouter {...appContext} {...roomContext} />;
}