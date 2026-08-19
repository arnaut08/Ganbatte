import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import BackButton from './common/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getMatchingResultScore, isQuestionCorrect, summarizeResults } from '@/utils/grammarScoring';
import { mergePlayerAnswers } from '@/utils/grammarRoomSync';
import { supabase } from '../config/supabase';

function GrammarPractice({ questions = [], onBack, room = null, username = '', onNextCard = null, onSubmitAnswer = null, forceShowResults = false }) {
  const [selectedLesson, setSelectedLesson] = useState(3);
  const [count, setCount] = useState(5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(Boolean(forceShowResults));
  const [showOpponentStatus, setShowOpponentStatus] = useState(true);
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
            ? 'bg-[#A3E636] text-black'
            : 'bg-[#FF6B6B] text-black',
        };
      }

      const score = getMatchingResultScore(question, rawAnswer);
      const hasPairs = score.total > 0;
      const label = hasPairs ? `${score.correct}/${score.total} pairs correct` : 'No pairs to score';

      return {
        label,
        className: score.correct === 0
          ? 'bg-neutral-300 text-black'
          : score.correct === score.total
            ? 'bg-[#A3E636] text-black'
            : 'bg-[#FFB347] text-black',
      };
    };

    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6">
  {/* 1. Header Bar */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        title="Back to previous screen"
      >
        <span className="font-mono text-lg font-black">&lt;</span>
      </button>

      <div className="flex flex-col justify-center">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
          // SESSION COMPLETE
        </span>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
          Assessment Results
        </h1>
      </div>
    </div>

    <div className="border-2 border-black bg-[#A3E636] px-3 py-1 font-mono text-xs font-black text-black shadow-[2px_2px_0px_0px_#000000]">
      MATCH FINISHED
    </div>
  </div>

  {/* 2. Podium Scoreboard */}
  {roomPlayers.length > 1 ? (
    <div className="grid gap-4 md:grid-cols-2">
      {playerResults.map((player, index) => {
        // Determine winner (highest score)
        const isWinner = playerResults.length > 1 && 
          player.summary.scorePercent >= Math.max(...playerResults.map(p => p.summary.scorePercent));

        return (
          <div
            key={`${player.name}-${index}`}
            className={`relative flex flex-col justify-between border-2 border-black p-5 shadow-[6px_6px_0px_0px_#000000] ${
              isWinner ? 'bg-[#FFDE59]' : 'bg-[#1a1f2c]'
            }`}
          >
            {/* Winner Pill */}
            <div className="flex items-center justify-between">
              <span className={`border-2 border-black px-2 py-0.5 font-mono text-[11px] font-black uppercase ${
                isWinner ? 'bg-black text-[#FFDE59]' : 'bg-[#2c3345] text-neutral-300'
              }`}>
                {isWinner ? '★ WINNER' : 'PARTICIPANT'}
              </span>
              <span className={`font-mono text-xs font-bold ${isWinner ? 'text-black/60' : 'text-neutral-400'}`}>
                P{index + 1}
              </span>
            </div>

            {/* Score Display */}
            <div className="my-4">
              <h2 className={`text-xl font-black uppercase truncate ${isWinner ? 'text-black' : 'text-white'}`}>
                {player.name}
              </h2>
              <div className={`mt-1 font-mono text-5xl font-black ${isWinner ? 'text-black' : 'text-[#A3E636]'}`}>
                {player.summary.scorePercent}%
              </div>
            </div>

            {/* Accuracy Tally */}
            <div className={`flex items-center gap-3 border-t-2 pt-3 font-mono text-xs font-black ${
              isWinner ? 'border-black/20 text-black' : 'border-neutral-700 text-neutral-400'
            }`}>
              <span className="text-[#10b981]">✔ {player.summary.correctCount} CORRECT</span>
              <span>·</span>
              <span className="text-[#ef4444]">✖ {player.summary.incorrectCount} WRONG</span>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    /* Solo Player Card */
    <div className="flex items-center justify-between border-2 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_#000000]">
      <div>
        <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-xs font-black text-[#FFDE59]">
          FINAL SCORE
        </span>
        <h2 className="mt-2 text-2xl font-black uppercase text-black">Overall Accuracy</h2>
        <p className="mt-1 font-mono text-xs font-bold text-black/70">
          {results.correctCount} correct out of {results.totalCount} total questions
        </p>
      </div>
      <div className="font-mono text-6xl font-black text-black">
        {results.scorePercent}%
      </div>
    </div>
  )}

  {/* 3. Detailed Question Breakdown */}
  <div className="space-y-4 pt-2">
    <div className="flex items-center justify-between border-b-2 border-neutral-700 pb-2">
      <span className="font-mono text-xs font-black uppercase tracking-wider text-[#70CFF8]">
        // ROUND-BY-ROUND BREAKDOWN ({questions.length} QUESTIONS)
      </span>
    </div>

    {questions.map((question, index) => (
      <div
        key={`question-${index}`}
        className="border-2 border-black bg-[#1a1f2c] p-5 shadow-[4px_4px_0px_0px_#000000] space-y-4"
      >
        {/* Question Header */}
        <div className="flex items-center justify-between border-b-2 border-black/40 pb-2">
          <div className="flex items-center gap-2">
            <span className="border border-black bg-white px-2 py-0.5 font-mono text-xs font-black text-black">
              Q{index + 1}
            </span>
            <span className="font-mono text-xs font-bold text-neutral-400 uppercase">
              {question.type}
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div>
          <p className="jp-font text-base font-bold text-white sm:text-lg">
            {question.prompt}
          </p>
          {question.englishText && (
            <p className="mt-1 font-mono text-xs font-bold text-neutral-400">
              EN: {question.englishText}
            </p>
          )}
        </div>

        {/* Player Submissions List */}
        <div className="grid gap-3 sm:grid-cols-2">
          {playerResults.map((player, playerIndex) => {
            const rawAnswer = player.answers[index];
            const answerText = formatAnswer(question, rawAnswer);
            const badge = getQuestionResultBadge(question, rawAnswer);
            const isCorrect = badge.label.toLowerCase().includes('correct') && !badge.label.includes('/');

            return (
              <div
                key={`${player.name}-${playerIndex}`}
                className="flex flex-col justify-between border-2 border-black bg-[#252c3d] p-3 shadow-[2px_2px_0px_0px_#000000]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-neutral-300">
                    {player.name}
                  </span>
                  <span
                    className={`border border-black px-1.5 py-0.5 font-mono text-[10px] font-black uppercase ${
                      isCorrect ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
                    }`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Answer Output */}
                <div className="mt-2">
                  {question.type === 'matching' ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {getMatchingPairStates(question, rawAnswer).map((pair, pIdx) => (
                        <span
                          key={pIdx}
                          className={`border border-black px-2 py-0.5 font-mono text-[11px] font-black ${
                            pair.isCorrect ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
                          }`}
                        >
                          {pair.left} → {pair.right}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="jp-font text-sm font-bold text-white">
                      {answerText || <span className="text-neutral-500 font-mono text-xs">[NO ANSWER]</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Official Correct Answer Banner */}
        <div className="border-2 border-black bg-[#A3E636] p-3 shadow-[2px_2px_0px_0px_#000000]">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black/70">
            CORRECT SOLUTION
          </span>
          <p className="jp-font text-sm font-black text-black sm:text-base mt-0.5">
            {getCorrectAnswerLabel(question)}
          </p>
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div className="border-l-2 border-[#FFDE59] pl-3 py-0.5">
            <p className="font-mono text-xs font-semibold text-neutral-300">
              <span className="text-[#FFDE59] font-black uppercase">// NOTE: </span>
              {question.explanation}
            </p>
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Solo Try Another Set Button */}
  {(!roomPlayers.length || roomPlayers.length === 1) && (
    <Button
      onClick={clearAnswers}
      className="w-full border-2 border-black bg-[#A3E636] py-5 font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      Try Another Set →
    </Button>
  )}
</div>
    );
  }

  if (!questions.length) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} label="Back to previous screen" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Grammar practice</CardTitle>
            <CardDescription className="font-bold">
              Choose a lesson range and generate a Genki grammar assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-wider text-black/70">Max lesson</label>
                <select
                  value={selectedLesson}
                  onChange={(event) => setSelectedLesson(Number(event.target.value))}
                  className="flex h-10 w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] focus:outline-none"
                >
                  {lessonOptions.map((lesson) => (
                    <option key={lesson} value={lesson}>Lesson {lesson}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black uppercase tracking-wider text-black/70">Question count</label>
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
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4">
      {/* 1. Arena Header & Progress Tracker */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // BATTLE ARENA: LESSON {currentQuestion?.lesson ?? 1}
          </span>
          <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            Grammar Assessment
          </h1>
        </div>

        {/* Question Counter Pill */}
        <div className="border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black text-black shadow-[2px_2px_0px_0px_#000000]">
          Q: {visibleIndex + 1} / {questions.length}
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-3 w-full border-2 border-black bg-[#252c3d] shadow-[2px_2px_0px_0px_#000000]">
        <div
          className="h-full bg-[#A3E636] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 2. Main Question & Interactive Arena Card */}
      <div className="relative overflow-hidden border-2 border-black bg-[#1a1f2c] p-5 shadow-[6px_6px_0px_0px_#000000] sm:p-7">

        {/* Question Banner */}
        <div className="relative border-2 border-black bg-[#FFDE59] p-5 shadow-[4px_4px_0px_0px_#000000]">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black/60">
            QUESTION PROMPT
          </span>
          <p className="jp-font mt-1 text-lg font-black text-black leading-snug sm:text-xl">
            {currentQuestion?.prompt}
          </p>
          {currentQuestion?.englishText && (
            <p className="mt-2 font-mono text-xs font-bold text-black/80">
              EN: {currentQuestion.englishText}
            </p>
          )}
        </div>

        {/* Choices / Input Area */}
        <div className="mt-6">
          {(currentQuestion?.type === 'multiple-choice' || currentQuestion?.type === 'comprehension') && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentQuestion.choices?.map((choice) => {
                const isSelected = answers[visibleIndex] === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleSelectAnswer(visibleIndex, choice)}
                    className={`jp-font flex items-center justify-between border-2 border-black px-4 py-3.5 text-base font-black transition-all ${isSelected
                        ? 'translate-x-[2px] translate-y-[2px] bg-[#A3E636] text-black shadow-none ring-2 ring-black'
                        : 'bg-white text-black shadow-[3px_3px_0px_0px_#000000] hover:bg-neutral-100 hover:translate-x-[1px] hover:translate-y-[1px]'
                      }`}
                  >
                    <span>{choice}</span>
                    {isSelected && <span className="font-mono text-sm">✓</span>}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion?.type === 'fill-in-the-blank' && (
            <div className="mx-auto w-full max-w-md space-y-2">
              <div className="relative">
                <Input
                  autoFocus
                  value={answers[visibleIndex] ?? ''}
                  onChange={(e) => handleSelectAnswer(visibleIndex, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hasCurrentAnswer && !isCurrentPlayerReady) {
                      handleNext();
                    }
                  }}
                  placeholder="Type your answer..."
                  className="jp-font h-14 w-full border-2 border-black bg-white px-4 text-center text-xl font-black text-black shadow-[4px_4px_0px_0px_#000000] placeholder:font-mono placeholder:text-sm placeholder:font-bold placeholder:text-neutral-400 focus-visible:bg-[#f3f8ff] focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                />
              </div>

              <p className="text-center font-mono text-[11px] font-bold text-neutral-400">
                PRESS [ENTER] TO SUBMIT
              </p>
            </div>
          )}

          {currentQuestion?.type === 'translation' && (
            <div className="mx-auto w-full max-w-lg mt-6 space-y-3">
              <div className="relative">
                <Input
                  autoFocus
                  value={answers[visibleIndex] ?? ''}
                  onChange={(e) => handleSelectAnswer(visibleIndex, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hasCurrentAnswer && !isCurrentPlayerReady) {
                      handleNext();
                    }
                  }}
                  placeholder="日本語で入力... (Romaji / Kana)"
                  className="jp-font h-14 w-full border-2 border-black bg-white px-4 text-center text-xl font-bold text-black shadow-[4px_4px_0px_0px_#000000] placeholder:font-sans placeholder:text-sm placeholder:font-medium placeholder:text-neutral-400 focus-visible:bg-[#f0f9ff] focus-visible:ring-0 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between px-1 font-mono text-[11px] font-bold text-neutral-400">
                <span>SUPPORTS ROMAJI &amp; KANA</span>
                <span>PRESS [ENTER] TO SUBMIT</span>
              </div>
            </div>
          )}

          {/* Matching Type UI */}
          {currentQuestion?.type === 'matching' && (
            <div className="space-y-5">
              {/* 1. Left & Right Selection Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* LEFT COLUMN */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#70CFF8]">
          // 01: SELECT DIGIT
                    </span>
                    <span className="font-mono text-[10px] font-bold text-neutral-500">
                      {currentQuestion.leftItems?.filter(item => getMatchingSelection(visibleIndex).pairs.some(p => p.left === item)).length} / {currentQuestion.leftItems?.length} PAIRED
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentQuestion.leftItems?.map((item) => {
                      const selected = getMatchingSelection(visibleIndex).selectedLeft === item;
                      const paired = getMatchingSelection(visibleIndex).pairs.some((p) => p.left === item);

                      return (
                        <button
                          key={item}
                          disabled={paired}
                          onClick={() => handleMatchingSelectLeft(visibleIndex, item)}
                          className={`flex w-full items-center justify-between border-2 border-black p-3.5 text-left font-black transition-all ${paired
                            ? 'border-black/50 bg-[#161a24] text-neutral-500 opacity-60 line-through cursor-not-allowed shadow-none'
                            : selected
                              ? 'translate-x-[2px] translate-y-[2px] bg-[#70CFF8] text-black shadow-none ring-2 ring-black'
                              : 'bg-white text-black shadow-[3px_3px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px]'
                            }`}
                        >
                          <span className="text-base">{item}</span>
                          {paired ? (
                            <span className="font-mono text-xs font-bold text-neutral-500 no-underline">PAIRED</span>
                          ) : selected ? (
                            <span className="font-mono text-xs font-black">ACTIVE</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#A3E636]">
          // 02: SELECT HIRAGANA
                    </span>
                    <span className="font-mono text-[10px] font-bold text-neutral-500">
                      {currentQuestion.rightItems?.filter(item => getMatchingSelection(visibleIndex).pairs.some(p => p.right === item)).length} / {currentQuestion.rightItems?.length} PAIRED
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentQuestion.rightItems?.map((item) => {
                      const selected = getMatchingSelection(visibleIndex).selectedRight === item;
                      const paired = getMatchingSelection(visibleIndex).pairs.some((p) => p.right === item);

                      return (
                        <button
                          key={item}
                          disabled={paired}
                          onClick={() => handleMatchingSelectRight(visibleIndex, item)}
                          className={`jp-font flex w-full items-center justify-between border-2 border-black p-3.5 text-left font-black transition-all ${paired
                            ? 'border-black/50 bg-[#161a24] text-neutral-500 opacity-60 line-through cursor-not-allowed shadow-none'
                            : selected
                              ? 'translate-x-[2px] translate-y-[2px] bg-[#A3E636] text-black shadow-none ring-2 ring-black'
                              : 'bg-white text-black shadow-[3px_3px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px]'
                            }`}
                        >
                          <span className="text-base">{item}</span>
                          {paired ? (
                            <span className="font-mono text-xs font-bold text-neutral-500 no-underline">PAIRED</span>
                          ) : selected ? (
                            <span className="font-mono text-xs font-black">ACTIVE</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Active Pairs Tray */}
              <div className="border-2 border-black bg-[#252c3d] p-4 shadow-[4px_4px_0px_0px_#000000]">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
        // CONNECTED PAIRS ({getMatchingSelection(visibleIndex).pairs.length}/{currentQuestion.leftItems?.length || 0})
                  </span>

                  {getMatchingSelection(visibleIndex).pairs.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => handleUndoMatching(visibleIndex)}
                      className="border-2 border-black bg-[#FF6B6B] px-3 py-1 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] hover:bg-[#ff8585] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      Undo All
                    </Button>
                  )}
                </div>

                {getMatchingSelection(visibleIndex).pairs.length === 0 ? (
                  <p className="font-mono text-xs font-bold text-neutral-400">
                    Click an item on the left, then click its corresponding match on the right.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getMatchingSelection(visibleIndex).pairs.map((pair, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black text-black shadow-[2px_2px_0px_0px_#000000]"
                      >
                        <span>{pair.left}</span>
                        <span className="text-[#FF6B6B] font-bold">→</span>
                        <span className="jp-font font-bold">{pair.right}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Bottom Controls Shelf & Opponent Toggle Bar */}
        <div className="mt-8 flex flex-col gap-4 border-t-2 border-black/40 pt-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Redesigned Opponent Presence Bar with Tactical Switch */}
          {room && otherPlayer ? (
            <div className="inline-flex items-center gap-2.5 border-2 border-black bg-[#252c3d] px-3 py-1.5 shadow-[2px_2px_0px_0px_#000000]">
              {/* Tactical Switch Button */}
              <button
                type="button"
                role="switch"
                aria-checked={showOpponentStatus}
                onClick={() => setShowOpponentStatus((prev) => !prev)}
                className="group relative inline-flex cursor-pointer items-center select-none focus:outline-none"
              >
                {/* Track */}
                <div
                  className={`flex h-6 w-11 items-center border-2 border-black p-0.5 transition-colors duration-150 ${showOpponentStatus ? 'bg-[#A3E636]' : 'bg-[#181a20]'
                    }`}
                >
                  {/* Thumb */}
                  <div
                    className={`h-4 w-4 border-2 border-black bg-white shadow-none transition-transform duration-150 ${showOpponentStatus ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </div>
              </button>

              {/* Opponent Info */}
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                <span className="text-neutral-400">VS</span>
                <span className="font-black text-white">{otherPlayer.name}:</span>
                {showOpponentStatus ? (
                  <span className="flex items-center gap-1 text-[#A3E636]">
                    <span>{opponentStatus.icon}</span>
                    <span>{opponentStatus.label}</span>
                  </span>
                ) : (
                  <span className="text-neutral-400">[HIDDEN]</span>
                )}
              </div>
            </div>
          ) : <div />}

          {/* Right Action: Status & Next Button */}
          <div className="flex items-center justify-end gap-3">
            <span className="font-mono text-xs font-bold text-neutral-400">
              {hasCurrentAnswer ? (isCurrentPlayerReady ? 'READY' : 'ANSWERED') : 'SELECT AN OPTION'}
            </span>

            <Button
              onClick={handleNext}
              disabled={!hasCurrentAnswer || isCurrentPlayerReady}
              className={`border-2 border-black px-6 py-5 text-sm font-black uppercase tracking-wider text-black transition-all ${!hasCurrentAnswer || isCurrentPlayerReady
                ? 'bg-neutral-600 text-neutral-400 opacity-60 shadow-none cursor-not-allowed'
                : 'bg-[#A3E636] shadow-[4px_4px_0px_0px_#000000] hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
            >
              {isRoomMode
                ? isCurrentPlayerReady
                  ? 'Waiting...'
                  : isLastQuestion
                    ? 'Finish'
                    : 'Ready →'
                : isLastQuestion
                  ? 'Finish Quiz'
                  : 'Next →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GrammarPractice;