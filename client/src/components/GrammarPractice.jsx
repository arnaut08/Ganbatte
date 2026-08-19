import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import BackButton from './common/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { getMatchingResultScore, isQuestionCorrect, normalizeText, summarizeResults } from '@/utils/grammarScoring';
import { mergePlayerAnswers } from '@/utils/grammarRoomSync';
import { supabase } from '../config/supabase';

function GrammarPractice({ questions = [], onBack, room = null, username = '', onNextCard = null, onSubmitAnswer = null, forceShowResults = false }) {
  const [selectedLesson, setSelectedLesson] = useState(3);
  const [count, setCount] = useState(5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(Boolean(forceShowResults));
  const savedResult = useRef(false);
  const isRoomMode = Boolean(room && room.players?.length > 0);

  useEffect(() => {
    setShowResults(Boolean(forceShowResults));
  }, [forceShowResults]);

  useEffect(() => {
    if (!showResults || !supabase || savedResult.current) return;

    const roomCode = room?.code || '';
    const questionHash = questions.map((q) => q?.prompt || '').join('|');
    const storageKey = `ganbatte-saved-grammar:${roomCode || questionHash}`;

    if (sessionStorage.getItem(storageKey) === 'true') {
      savedResult.current = true;
      return;
    }

    // Set the key synchronously to prevent duplicate saves across remounts
    sessionStorage.setItem(storageKey, 'true');
    savedResult.current = true;

    const saveGrammarResult = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        console.error('Supabase session unavailable while saving grammar result:', sessionError || 'No active session');
        sessionStorage.removeItem(storageKey);
        savedResult.current = false;
        return;
      }

      const authenticatedUserId = session.user.id;

      let playerAnswers;
      let companionUserId = null;

      if (isRoomMode && Array.isArray(room?.players) && room.players.length > 0) {
        const currentPlayer = room.players.find((player) => player.userId === authenticatedUserId)
          || room.players.find((player) => player.name === username)
          || room.players[0];
        playerAnswers = Array.isArray(currentPlayer?.answers) ? currentPlayer.answers : [];
        const companion = room.players.find((player) => player !== currentPlayer);
        companionUserId = companion?.userId || null;
      } else {
        playerAnswers = questions.map((_, index) => answers[index]);
      }

      const summary = summarizeResults(questions, playerAnswers);

      const { error } = await supabase.from('assessment_results').insert({
        user_id: authenticatedUserId,
        assessment_type: 'grammar',
        score_percentage: summary.scorePercent,
        correct_questions: summary.correctCount,
        total_questions: summary.totalCount,
        companion_user_id: companionUserId,
        details: {
          answers: playerAnswers,
          questions,
        },
      });

      if (error) {
        console.error('Unable to save grammar assessment result:', error);
        sessionStorage.removeItem(storageKey);
        savedResult.current = false;
      }
    };

    saveGrammarResult();
  }, [showResults, questions, answers, isRoomMode, room, username]);

  const visibleIndex = isRoomMode && Number.isInteger(room.currentCardIndex) ? room.currentCardIndex : currentIndex;
  const currentQuestion = questions[visibleIndex] || null;
  const progress = questions.length > 0 ? ((visibleIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = questions.length > 0 && visibleIndex === questions.length - 1;
  const allQuestionsAnswered = questions.length > 0 && questions.every((question, index) => answers[index] !== undefined);
  const results = useMemo(() => summarizeResults(questions, questions.map((_, index) => answers[index])), [answers, questions]);
  const currentPlayer = room?.players?.find((player) => player.name === username) || room?.players?.[0] || null;
  const otherPlayer = room?.players?.find((player) => player !== currentPlayer) || null;
  const isCurrentPlayerReady = currentPlayer?.ready === true;
  const showAllQuestionsAnsweredBanner = isRoomMode
    ? isCurrentPlayerReady && isLastQuestion
    : allQuestionsAnswered;

  useEffect(() => {
    if (!isRoomMode || !Array.isArray(currentPlayer?.answers)) return;

    const syncedAnswers = mergePlayerAnswers(answers, currentPlayer.answers);

    setAnswers((previous) => {
      const next = mergePlayerAnswers(previous, currentPlayer.answers);
      const sameShape = Object.keys(previous).length === Object.keys(next).length
        && Object.entries(next).every(([key, value]) => JSON.stringify(previous[Number(key)]) === JSON.stringify(value));
      if (sameShape) return previous;
      return next;
    });
  }, [currentPlayer?.answers, isRoomMode]);

  const currentAnswer = answers[visibleIndex];
  const hasCurrentAnswer = (() => {
    if (currentAnswer === undefined || currentAnswer === null) return false;
    if (typeof currentAnswer === 'string') return currentAnswer.trim() !== '';
    if (typeof currentAnswer === 'object' && Array.isArray(currentAnswer.pairs)) return currentAnswer.pairs.length > 0;
    return true;
  })();
  const isOtherPlayerReady = otherPlayer?.ready === true;
  const otherHasCurrentAnswer = Array.isArray(otherPlayer?.answers) && otherPlayer.answers[visibleIndex] !== undefined;
  const opponentStatus = room && otherPlayer
    ? {
        label: otherPlayer.ready === true ? 'Ready' : otherHasCurrentAnswer ? 'Attempting' : 'Waiting',
        icon: otherPlayer.ready === true ? '✅' : otherHasCurrentAnswer ? '🟡' : '⏳',
      }
    : room && room.players?.length > 1
      ? { label: 'Waiting', icon: '⏳' }
      : { label: 'Solo practice', icon: '✨' };

  const lessonOptions = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], []);

  const handleSelectAnswer = (questionIndex, value) => {
    setAnswers((current) => ({ ...current, [questionIndex]: value }));
  };

  const getMatchingSelection = (questionIndex) => {
    const value = answers[questionIndex];
    if (value && typeof value === 'object' && Array.isArray(value.pairs)) {
      return value;
    }
    return { selectedLeft: null, selectedRight: null, pairs: [] };
  };

  const updateMatchingSelection = (questionIndex, updater) => {
    setAnswers((current) => {
      const previous = getMatchingSelection(questionIndex);
      const next = updater(previous);
      return { ...current, [questionIndex]: next };
    });
  };

  const handleMatchingSelectLeft = (questionIndex, leftValue) => {
    updateMatchingSelection(questionIndex, (current) => {
      const usedLeft = new Set(current.pairs.map((pair) => pair.left));
      if (usedLeft.has(leftValue) && current.selectedLeft !== leftValue) {
        return current;
      }

      if (current.selectedLeft === leftValue) {
        return { ...current, selectedLeft: null };
      }

      return { ...current, selectedLeft: leftValue };
    });
  };

  const handleMatchingSelectRight = (questionIndex, rightValue) => {
    updateMatchingSelection(questionIndex, (current) => {
      const usedRight = new Set(current.pairs.map((pair) => pair.right));
      if (usedRight.has(rightValue) && current.selectedRight !== rightValue) {
        return current;
      }

      if (!current.selectedLeft) {
        if (current.selectedRight === rightValue) {
          return { ...current, selectedRight: null };
        }
        return { ...current, selectedRight: rightValue };
      }

      if (current.selectedRight === rightValue) {
        return { ...current, selectedRight: null };
      }

      return {
        ...current,
        pairs: [...current.pairs, { left: current.selectedLeft, right: rightValue }],
        selectedLeft: null,
        selectedRight: null,
      };
    });
  };

  const handleUndoMatching = (questionIndex) => {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: { selectedLeft: null, selectedRight: null, pairs: [] },
    }));
  };

  const submitCurrentAnswer = () => {
    if (!isRoomMode || !onSubmitAnswer) return false;
    if (!hasCurrentAnswer) return false;

    const normalizedAnswer = currentQuestion?.type === 'matching'
      ? (Array.isArray(currentAnswer) ? currentAnswer : (currentAnswer && typeof currentAnswer === 'object' && Array.isArray(currentAnswer.pairs) ? currentAnswer.pairs : currentAnswer))
      : currentAnswer;

    onSubmitAnswer(normalizedAnswer);
    return true;
  };

  const handleNext = () => {
    if (isRoomMode) {
      if (!hasCurrentAnswer || isCurrentPlayerReady || !onNextCard) {
        return;
      }

      submitCurrentAnswer();
      onNextCard();
      return;
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
      return;
    }

    setShowResults(true);
  };

  const handlePrevious = () => {
    if (isRoomMode) return;
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  const clearAnswers = () => {
    const roomCode = room?.code || '';
    const questionHash = questions.map((q) => q?.prompt || '').join('|');
    const storageKey = `ganbatte-saved-grammar:${roomCode || questionHash}`;
    sessionStorage.removeItem(storageKey);
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
    savedResult.current = false;
  };

  if (showResults) {
    const roomPlayers = Array.isArray(room?.players) && room.players.length > 0
      ? room.players
      : [{ name: username || 'Player 1', answers: Object.entries(answers).map(([index, value]) => ({ index: Number(index), value })) }];

    const playerResults = roomPlayers.map((player) => {
      const playerAnswers = Array.isArray(player.answers) ? player.answers : [];
      const normalizedAnswers = questions.map((_, index) => {
        const answer = playerAnswers[index];
        if (answer !== undefined && answer !== null) return answer;
        return answers[index];
      });

      return {
        ...player,
        summary: summarizeResults(questions, normalizedAnswers),
        answers: normalizedAnswers,
      };
    });

    const normalizeMatchingPairs = (value) => {
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object' && Array.isArray(value.pairs)) return value.pairs;
      return [];
    };

    const getMatchingPairStates = (question, rawAnswer) => {
      const expectedPairs = Array.isArray(question.correctPairs)
        ? question.correctPairs
        : (question.correctPairs && typeof question.correctPairs === 'object')
          ? Object.entries(question.correctPairs).map(([left, right]) => ({ left, right }))
          : [];
      const expectedMap = expectedPairs.reduce((accumulator, pair) => {
        const left = String(pair.left ?? '').trim();
        const right = String(pair.right ?? '').trim();
        if (left && right) {
          accumulator[left] = right;
        }
        return accumulator;
      }, {});
      const selectedPairs = normalizeMatchingPairs(rawAnswer).reduce((accumulator, pair) => {
        if (pair && pair.left && pair.right) {
          accumulator[String(pair.left).trim()] = String(pair.right).trim();
        }
        return accumulator;
      }, {});

      const states = Object.entries(selectedPairs).map(([left, right]) => ({
        left,
        right,
        isCorrect: expectedMap[left] === right,
      }));

      Object.entries(expectedMap).forEach(([left, right]) => {
        if (!selectedPairs[left]) {
          states.push({
            left,
            right,
            isCorrect: false,
          });
        }
      });

      return states;
    };

    const formatAnswer = (question, rawAnswer) => {
      if (question.type === 'matching') {
        const pairs = normalizeMatchingPairs(rawAnswer);

        if (pairs.length === 0) return 'No answer';
        return pairs.map((pair) => `${pair.left} → ${pair.right}`).join(', ');
      }

      if (rawAnswer === undefined || rawAnswer === null || rawAnswer === '') return 'No answer';
      return String(rawAnswer);
    };

    const getCorrectAnswerLabel = (question) => {
      if (question.type === 'matching') {
        const pairs = Array.isArray(question.correctPairs)
          ? question.correctPairs
          : (question.correctPairs && typeof question.correctPairs === 'object')
            ? Object.entries(question.correctPairs).map(([left, right]) => ({ left, right }))
            : [];

        if (pairs.length === 0) return 'No answer';
        return pairs.map((pair) => `${pair.left} → ${pair.right}`).join(', ');
      }

      if (typeof question.correctAnswer !== 'undefined') return String(question.correctAnswer);
      if (Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0) return question.acceptedAnswers.join(' / ');
      if (question.englishText) return question.englishText;
      return 'No answer';
    };

    const isQuestionCorrectForPlayer = (question, rawAnswer) => isQuestionCorrect(question, rawAnswer);

    const getQuestionResultBadge = (question, rawAnswer) => {
      if (question.type !== 'matching') {
        return {
          label: isQuestionCorrectForPlayer(question, rawAnswer) ? 'Correct' : 'Incorrect',
          className: isQuestionCorrectForPlayer(question, rawAnswer)
            ? 'bg-green-500/20 text-green-300'
            : 'bg-red-500/20 text-red-300',
        };
      }

      const score = getMatchingResultScore(question, rawAnswer);
      const hasPairs = score.total > 0;
      const label = hasPairs ? `${score.correct}/${score.total} pairs correct` : 'No pairs to score';

      return {
        label,
        className: score.correct === 0
          ? 'bg-slate-500/20 text-slate-200'
          : score.correct === score.total
            ? 'bg-green-500/20 text-green-300'
            : 'bg-amber-500/20 text-amber-200',
      };
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <BackButton onClick={onBack} label="Back to previous screen" />
          <div className="text-sm text-muted-foreground">Quiz complete</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {roomPlayers.length > 1
                ? 'Both players completed the grammar assessment.'
                : `You scored ${results.correctCount} out of ${results.totalCount}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roomPlayers.length > 1 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {playerResults.map((player, index) => (
                  <div key={`${player.name}-${index}`} className="rounded-md border border-border bg-muted/20 p-4">
                    <p className="text-lg font-semibold">{player.name}</p>
                    <p className="text-3xl font-bold">{player.summary.scorePercent}%</p>
                    <p className="text-sm text-muted-foreground">
                      {player.summary.correctCount} correct · {player.summary.incorrectCount} incorrect
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/20 p-4">
                <p className="text-3xl font-bold">{results.scorePercent}%</p>
                <p className="text-sm text-muted-foreground">
                  {results.correctCount} correct · {results.incorrectCount} incorrect
                </p>
              </div>
            )}

            <div className="space-y-3">
              {questions.map((question, index) => (
                <div key={`question-${index}`} className="rounded-md border border-border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="font-medium">Question {index + 1}</p>
                    <span className="text-xs text-muted-foreground">{roomPlayers.length > 1 ? 'Both players' : 'Your answer'}</span>
                  </div>

                  <p className="text-sm text-muted-foreground">{question.prompt}</p>
                  {question.englishText && (
                    <p className="mt-2 text-sm text-muted-foreground">English: {question.englishText}</p>
                  )}

                  <div className="mt-3 space-y-3">
                    {playerResults.map((player, playerIndex) => {
                      const rawAnswer = player.answers[index];
                      const answerText = formatAnswer(question, rawAnswer);
                      const badge = getQuestionResultBadge(question, rawAnswer);

                      return (
                        <div key={`${player.name}-${playerIndex}`} className="rounded-md border border-border bg-muted/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{player.name}</p>
                            <span className={`rounded-full px-2 py-1 text-xs ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>

                          {question.type === 'matching' ? (
                            <div className="mt-2 space-y-2">
                              {getMatchingPairStates(question, rawAnswer).map((pair, pairIndex) => (
                                <div
                                  key={`${player.name}-${pair.left}-${pair.right}-${pairIndex}`}
                                  className={`rounded border px-2 py-1 text-xs ${pair.isCorrect ? 'border-green-500/50 bg-green-500/10 text-green-200' : 'border-red-500/50 bg-red-500/10 text-red-200'}`}
                                >
                                  {pair.left} → {pair.right}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm"><span className="font-medium text-foreground">Answer:</span> {answerText}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-md border border-green-500/20 bg-green-950/10 p-3">
                    <p className="text-sm font-medium text-green-300">Correct answer</p>
                    <p className="mt-1 text-sm">{getCorrectAnswerLabel(question)}</p>
                  </div>

                  {question.explanation && (
                    <p className="mt-3 text-sm text-muted-foreground">Explanation: {question.explanation}</p>
                  )}
                </div>
              ))}
            </div>

            {!roomPlayers.length || roomPlayers.length === 1 ? <Button onClick={clearAnswers}>Try another set</Button> : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Back to previous screen" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grammar practice</CardTitle>
            <CardDescription>
              Choose a lesson range and generate a Genki grammar assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Max lesson</label>
                <select
                  value={selectedLesson}
                  onChange={(event) => setSelectedLesson(Number(event.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {lessonOptions.map((lesson) => (
                    <option key={lesson} value={lesson}>Lesson {lesson}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Question count</label>
                <Input
                  type="number"
                  min={1}
                  max={25}
                  value={count}
                  onChange={(event) => setCount(Math.max(1, Math.min(25, Number(event.target.value) || 1)))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => window.generateGrammarAssessment?.(selectedLesson, count)}
                variant="default"
              >
                Generate assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Question {visibleIndex + 1} / {questions.length}</span>
        </div>
      </div>

      <Card className="relative">
        {room && otherPlayer && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
              <span>{otherPlayer.name}</span>
              <span>{opponentStatus.icon}</span>
              <span>{opponentStatus.label}</span>
            </span>
          </div>
        )}

        <CardHeader>
          <CardTitle>Grammar practice</CardTitle>
          <CardDescription>
            Lesson {currentQuestion?.lesson ?? 1} · {currentQuestion?.type ?? 'multiple-choice'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={progress} className="h-2" />

          <div className="rounded-md border border-border bg-muted/20 p-4">
            <p className="text-lg font-medium">{currentQuestion?.prompt}</p>
            {currentQuestion?.englishText && (
              <p className="mt-2 text-sm text-muted-foreground">English: {currentQuestion.englishText}</p>
            )}
          </div>

          {currentQuestion?.type === 'multiple-choice' && (
            <div className="grid gap-2">
              {currentQuestion.choices?.map((choice) => (
                <Button
                  key={choice}
                  variant={answers[visibleIndex] === choice ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => handleSelectAnswer(visibleIndex, choice)}
                >
                  {choice}
                </Button>
              ))}
            </div>
          )}

          {currentQuestion?.type === 'fill-in-the-blank' && (
            <div className="space-y-2">
              <Input
                value={answers[visibleIndex] ?? ''}
                onChange={(event) => handleSelectAnswer(visibleIndex, event.target.value)}
                placeholder="Type your answer"
              />
            </div>
          )}

          {currentQuestion?.type === 'matching' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Left options</p>
                  <div className="space-y-2">
                    {currentQuestion.leftItems?.map((item) => {
                      const selected = getMatchingSelection(visibleIndex).selectedLeft === item;
                      const paired = getMatchingSelection(visibleIndex).pairs.some((pair) => pair.left === item);

                      return (
                        <Button
                          key={item}
                          variant={selected ? 'default' : 'outline'}
                          className="w-full justify-start"
                          disabled={paired}
                          onClick={() => handleMatchingSelectLeft(visibleIndex, item)}
                        >
                          {item}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Right options</p>
                  <div className="space-y-2">
                    {currentQuestion.rightItems?.map((item) => {
                      const selected = getMatchingSelection(visibleIndex).selectedRight === item;
                      const paired = getMatchingSelection(visibleIndex).pairs.some((pair) => pair.right === item);

                      return (
                        <Button
                          key={item}
                          variant={selected ? 'default' : 'outline'}
                          className="w-full justify-start"
                          disabled={paired}
                          onClick={() => handleMatchingSelectRight(visibleIndex, item)}
                        >
                          {item}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">Current pairs</p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUndoMatching(visibleIndex)}
                  >
                    Undo
                  </Button>
                </div>

                {getMatchingSelection(visibleIndex).pairs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pairs selected yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getMatchingSelection(visibleIndex).pairs.map((pair, index) => (
                      <span key={`${pair.left}-${pair.right}-${index}`} className="rounded-full border border-border bg-background px-2 py-1 text-xs">
                        {pair.left} → {pair.right}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentQuestion?.type === 'translation' && (
            <div className="space-y-2">
              <Input
                value={answers[visibleIndex] ?? ''}
                onChange={(event) => handleSelectAnswer(visibleIndex, event.target.value)}
                placeholder="Type the Japanese translation"
              />
            </div>
          )}

          {currentQuestion?.type === 'comprehension' && (
            <div className="grid gap-2">
              {currentQuestion.choices?.map((choice) => (
                <Button
                  key={choice}
                  variant={answers[visibleIndex] === choice ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => handleSelectAnswer(visibleIndex, choice)}
                >
                  {choice}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <div className="text-sm text-muted-foreground">
              {currentQuestion?.type === 'matching'
                ? `${getMatchingSelection(visibleIndex).pairs.length} pair(s) selected`
                : hasCurrentAnswer
                  ? isCurrentPlayerReady
                    ? 'You are ready'
                    : 'Current answer ready'
                  : 'No answer selected'}
            </div>

            {isRoomMode ? (
              <Button onClick={handleNext} disabled={!hasCurrentAnswer || isCurrentPlayerReady || !onNextCard}>
                {isCurrentPlayerReady ? 'Waiting for opponent...' : isLastQuestion ? 'Finish' : 'Ready'}
              </Button>
            ) : currentIndex < questions.length - 1 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleNext}>Finish quiz</Button>
            )}
          </div>

        </CardContent>
      </Card>
      {showAllQuestionsAnsweredBanner && (
        <div className="rounded-md border border-green-500/30 bg-green-950/20 p-3 text-sm text-green-300">
          All questions answered.
        </div>
      )}
    </div>
  );
}

export default GrammarPractice;
