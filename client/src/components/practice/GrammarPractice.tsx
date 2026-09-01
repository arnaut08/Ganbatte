import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ComponentType, KeyboardEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getMatchingResultScore, isQuestionCorrect, kanaToRomaji, summarizeResults } from '@/utils/grammarScoring';
import { mergePlayerAnswers } from '@/utils/grammarRoomSync';
import { getGrammarResultFeedback } from '@/utils/grammarFeedback';
import { getGrammarOverview, saveGrammarQuizResult } from '../../services/api';
import useActivityRecorder from '../../hooks/useActivityRecorder';
import type { AnswerMap, GrammarAnswer, GrammarOverviewResponse, GrammarQuestion, MatchingAnswerState, MatchingPair } from '@/types';
import { supabase } from '../../config/supabase';
import GrammarPracticeHeader from './GrammarPracticeHeader';
import GrammarQuestionPrompt from './GrammarQuestionPrompt';
import AssessmentLoadingScreen from './AssessmentLoadingScreen';

const isMatchingAnswer = (value: unknown): value is MatchingAnswerState => (
  typeof value === 'object' && value !== null && 'pairs' in value && Array.isArray(value.pairs)
);
type GrammarRoomPlayer = { name?: string; userId?: string | null; answers?: GrammarAnswer[]; ready?: boolean };
type GrammarRoom = { code?: string; currentCardIndex?: number; players?: GrammarRoomPlayer[] };
type GrammarPracticeProps = {
  questions?: GrammarQuestion[];
  onBack: () => void;
  room?: GrammarRoom | null;
  username?: string;
  onNextCard?: (() => void) | null;
  onSubmitAnswer?: ((answer: unknown) => void) | null;
  onForfeit?: (() => void) | null;
  forceShowResults?: boolean;
};
type LegacyProps = { children?: ReactNode; className?: string;[key: string]: unknown };
const LegacyButton = Button as unknown as ComponentType<LegacyProps>;
const LegacyInput = Input as unknown as ComponentType<LegacyProps>;

function GrammarPractice({ questions = [], onBack, room = null, username = '', onNextCard = null, onSubmitAnswer = null, onForfeit = null, forceShowResults = false }: GrammarPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [showResults, setShowResults] = useState(Boolean(forceShowResults));
  const [showOpponentStatus, setShowOpponentStatus] = useState(true);
  const [showForfeitConfirmation, setShowForfeitConfirmation] = useState(false);
  const [grammarMastery, setGrammarMastery] = useState<GrammarOverviewResponse | null>(null);
  const [isGeneratingSet, setIsGeneratingSet] = useState(false);
  const savedResult = useRef(false);
  const isRoomMode = Boolean(room?.players && room.players.length > 0);
  const sessionLabel = isRoomMode ? 'Assessment' : 'Practice';
  const { recordActivity } = useActivityRecorder();

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

    sessionStorage.setItem(storageKey, 'true');
    savedResult.current = true;

    const saveGrammarResult = async () => {
      const supabaseClient = supabase;
      if (!supabaseClient) return;
      const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
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

      const { error } = await supabaseClient.from('assessment_results').insert({
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
        return;
      }

      let quizResultSaved = false;
      let lessonNumber = 0;
      if (summary.totalCount > 0) {
        const lessonNumbers = new Set(
          questions
            .map((question) => Number(question?.lesson))
            .filter((lesson) => Number.isInteger(lesson) && lesson > 0),
        );
        lessonNumber = lessonNumbers.size === 1 ? Number([...lessonNumbers][0]) : 0;

        try {
          await saveGrammarQuizResult({
            lessonNumber,
            totalQuestions: summary.totalCount,
            correctCount: summary.correctCount,
            scorePercentage: summary.scorePercent,
            passed: summary.scorePercent >= 80,
          });
          quizResultSaved = true;
        } catch (quizResultError) {
          console.warn('Unable to save grammar quiz result:', quizResultError);
        }
      }

      if (summary.scorePercent >= 80) {
        if (quizResultSaved && summary.scorePercent < 100 && lessonNumber > 0) {
          try {
            const overview = await getGrammarOverview();
            setGrammarMastery(overview);
          } catch (overviewError) {
            console.warn('Unable to load grammar mastery state:', overviewError);
          }
        }
        try {
          await recordActivity();
        } catch (activityError) {
          console.warn('Unable to record grammar practice activity:', activityError);
        }
      }
    };

    saveGrammarResult();
  }, [showResults, questions, answers, isRoomMode, room, username]);

  const visibleIndex = isRoomMode && Number.isInteger(room?.currentCardIndex) ? room?.currentCardIndex ?? currentIndex : currentIndex;
  const currentQuestion = questions[visibleIndex] || null;
  const progress = questions.length > 0 ? ((visibleIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = questions.length > 0 && visibleIndex === questions.length - 1;
  const results = useMemo(() => summarizeResults(questions, questions.map((_, index) => answers[index])), [answers, questions]);
  const currentPlayer = room?.players?.find((player) => player.name === username) || room?.players?.[0] || null;
  const otherPlayer = room?.players?.find((player) => player !== currentPlayer) || null;
  const isCurrentPlayerReady = currentPlayer?.ready === true;

  useEffect(() => {
    if (!isRoomMode || !Array.isArray(currentPlayer?.answers)) return;

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
    if (isMatchingAnswer(currentAnswer)) return currentAnswer.pairs.length > 0;
    return true;
  })();
  const otherHasCurrentAnswer = Array.isArray(otherPlayer?.answers) && otherPlayer.answers[visibleIndex] !== undefined;
  const opponentStatus = room && otherPlayer
    ? {
      label: otherPlayer.ready === true ? 'Ready' : otherHasCurrentAnswer ? 'Attempting' : 'Waiting',
      icon: otherPlayer.ready === true ? '✅' : otherHasCurrentAnswer ? '🟡' : '⏳',
    }
    : room && (room.players?.length ?? 0) > 1
      ? { label: 'Waiting', icon: '⏳' }
      : { label: 'Solo practice', icon: '✨' };

  const handleSelectAnswer = (questionIndex: number, value: GrammarAnswer) => {
    setAnswers((current) => ({ ...current, [questionIndex]: value }));
  };

  const getMatchingSelection = (questionIndex: number): MatchingAnswerState => {
    const value = answers[questionIndex];
    if (isMatchingAnswer(value)) {
      return value;
    }
    return { selectedLeft: null, selectedRight: null, pairs: [] };
  };

  const updateMatchingSelection = (questionIndex: number, updater: (current: MatchingAnswerState) => MatchingAnswerState) => {
    setAnswers((current) => {
      const previous = getMatchingSelection(questionIndex);
      const next = updater(previous);
      return { ...current, [questionIndex]: next };
    });
  };

  const handleMatchingSelectLeft = (questionIndex: number, leftValue: string) => {
    updateMatchingSelection(questionIndex, (current: MatchingAnswerState) => {
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

  const handleMatchingSelectRight = (questionIndex: number, rightValue: string) => {
    updateMatchingSelection(questionIndex, (current: MatchingAnswerState) => {
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

  const handleUndoMatching = (questionIndex: number) => {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: { selectedLeft: null, selectedRight: null, pairs: [] },
    }));
  };

  const submitCurrentAnswer = () => {
    if (!isRoomMode || !onSubmitAnswer) return false;
    if (!hasCurrentAnswer) return false;

    const normalizedAnswer = currentQuestion?.type === 'matching'
      ? (Array.isArray(currentAnswer) ? currentAnswer : (isMatchingAnswer(currentAnswer) ? currentAnswer.pairs : currentAnswer))
      : currentAnswer;

    onSubmitAnswer(normalizedAnswer);
    return true;
  };

  const handleNext = () => {
    if (isRoomMode) {
      if (!hasCurrentAnswer || isCurrentPlayerReady || !onNextCard) return;
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

  if (isGeneratingSet) {
    return <AssessmentLoadingScreen title="PREPARING GRAMMAR DECK" description="Generating fresh questions..." />;
  }

  if (showResults) {
    const roomPlayers: GrammarRoomPlayer[] = Array.isArray(room?.players) && room.players.length > 0
      ? room.players
      : [{ name: username || 'Player 1', answers: questions.map((_, index) => answers[index]) }];

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

    const feedbackLessonNumbers = new Set(
      questions
        .map((question) => Number(question?.lesson))
        .filter((lesson) => Number.isInteger(lesson) && lesson > 0),
    );
    const feedbackLessonNumber = feedbackLessonNumbers.size === 1 ? Number([...feedbackLessonNumbers][0]) : 0;
    const feedbackMastered = feedbackLessonNumber > 0
      && Boolean(grammarMastery?.lessons.find((lesson) => lesson.lesson_number === feedbackLessonNumber)?.is_mastered);
    const grammarFeedback = getGrammarResultFeedback(results.scorePercent, feedbackMastered);

    const handleTryAnotherSet = async () => {
      if (isGeneratingSet) return;
      setIsGeneratingSet(true);
      clearAnswers();
      try {
        const generateNext = (window as Window & {
          generateGrammarAssessment?: (lesson: number, questionCount: number) => Promise<void> | void;
        }).generateGrammarAssessment;
        await generateNext?.(feedbackLessonNumber || 12, questions.length || 10);
      } finally {
        setIsGeneratingSet(false);
      }
    };

    const normalizeMatchingPairs = (value: unknown): MatchingPair[] => {
      if (Array.isArray(value)) return value as MatchingPair[];
      if (isMatchingAnswer(value)) return value.pairs;
      return [];
    };

    const getMatchingPairStates = (question: GrammarQuestion, rawAnswer: unknown) => {
      const expectedPairs = Array.isArray(question.correctPairs)
        ? question.correctPairs
        : (question.correctPairs && typeof question.correctPairs === 'object')
          ? Object.entries(question.correctPairs).map(([left, right]) => ({ left, right }))
          : [];
      const expectedMap = expectedPairs.reduce<Record<string, string>>((accumulator, pair) => {
        const left = String(pair.left ?? '').trim();
        const right = String(pair.right ?? '').trim();
        if (left && right) {
          accumulator[left] = right;
        }
        return accumulator;
      }, {});
      const selectedPairs = normalizeMatchingPairs(rawAnswer).reduce<Record<string, string>>((accumulator, pair) => {
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

    const formatAnswer = (question: GrammarQuestion, rawAnswer: unknown) => {
      if (question.type === 'matching') {
        const pairs = normalizeMatchingPairs(rawAnswer);
        if (pairs.length === 0) return 'No answer';
        return pairs.map((pair) => `${pair.left} → ${pair.right}`).join(', ');
      }
      if (rawAnswer === undefined || rawAnswer === null || rawAnswer === '') return 'No answer';
      return String(rawAnswer);
    };

    const getCorrectAnswerLabel = (question: GrammarQuestion) => {
      if (question.type === 'matching') {
        const pairs = Array.isArray(question.correctPairs)
          ? question.correctPairs
          : (question.correctPairs && typeof question.correctPairs === 'object')
            ? Object.entries(question.correctPairs).map(([left, right]) => ({ left, right }))
            : [];
        if (pairs.length === 0) return 'No answer';
        return pairs.map((pair) => `${pair.left} → ${pair.right}`).join(', ');
      }
      const answers = Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0
        ? question.acceptedAnswers
        : typeof question.acceptedAnswers !== 'undefined' && question.acceptedAnswers !== null && question.acceptedAnswers !== ''
          ? [question.acceptedAnswers]
          : typeof question.correctAnswer !== 'undefined' ? [question.correctAnswer] : [];
      if (answers.length > 0) {
        return answers.map((answer: unknown, index: number) => {
          const answerText = String(answer);
          if (!kanaToRomaji(answerText)) return answerText;
          const romaji = index === 0 && question.correctAnswerRomaji
            ? question.correctAnswerRomaji
            : kanaToRomaji(answerText);
          return `${answerText} (${romaji})`;
        }).join(' / ');
      }
      if (question.englishText) return question.englishText;
      return 'No answer';
    };

    const isQuestionCorrectForPlayer = (question: GrammarQuestion, rawAnswer: unknown) => isQuestionCorrect(question, rawAnswer as GrammarAnswer);

    const getQuestionResultBadge = (question: GrammarQuestion, rawAnswer: unknown) => {
      if (question.type !== 'matching') {
        return {
          label: isQuestionCorrectForPlayer(question, rawAnswer) ? 'Correct' : 'Incorrect',
          className: isQuestionCorrectForPlayer(question, rawAnswer)
            ? 'bg-[#A3E636] text-black'
            : 'bg-[#FF6B6B] text-black',
        };
      }
      const score = getMatchingResultScore(question, rawAnswer as GrammarAnswer);
      const hasPairs = score.total > 0;
      const label = hasPairs ? `${score.correct}/${score.total} pairs correct` : 'No pairs to score';
      return {
        label,
        className: score.correct === 0
          ? 'bg-neutral-300 text-black'
          : score.correct === score.total
            ? 'bg-[#A3E636] text-black'
            : 'bg-[#FFDE59] text-black',
      };
    };

    return (
      <div className="mx-auto w-full max-w-4xl space-y-3.5 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onBack}
              className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              title="Back to previous screen"
            >
              <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
            </button>

            <div className="flex flex-col justify-center">
              <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#C084FC]">
                // {sessionLabel.toUpperCase()} COMPLETE
              </span>
              <h1 className="text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
                {sessionLabel} Results
              </h1>
            </div>
          </div>

          <div className="border-2 border-black bg-[#A3E636] px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
            {sessionLabel.toUpperCase()} FINISHED
          </div>
        </div>

        {/* 2. Podium Scoreboard */}
        {roomPlayers.length > 1 ? (
          <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
            {playerResults.map((player, index) => {
              const isWinner = playerResults.length > 1 &&
                player.summary.scorePercent >= Math.max(...playerResults.map(p => p.summary.scorePercent));

              return (
                <div
                  key={`${player.name}-${index}`}
                  className={`relative flex flex-col justify-between border-2 border-black p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] ${isWinner ? 'bg-[#C084FC] text-black' : 'bg-[#1f2637] text-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`border-2 border-black px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[11px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] ${isWinner ? 'bg-white text-black' : 'bg-black text-[#C084FC]'
                      }`}>
                      {isWinner ? '★ WINNER' : 'PARTICIPANT'}
                    </span>
                    <span className={`font-mono text-[10px] sm:text-xs font-bold ${isWinner ? 'text-black/60' : 'text-neutral-400'}`}>
                      P{index + 1}
                    </span>
                  </div>

                  <div className="my-2 sm:my-4">
                    <h2 className="text-base sm:text-xl font-black uppercase truncate">
                      {player.name}
                    </h2>
                    <div className={`mt-0.5 sm:mt-1 font-mono text-3xl sm:text-5xl font-black leading-none ${isWinner ? 'text-black' : 'text-[#A3E636]'}`}>
                      {player.summary.scorePercent}%
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 sm:gap-3 border-t-2 pt-2 sm:pt-3 font-mono text-[10px] sm:text-xs font-black ${isWinner ? 'border-black/20 text-black' : 'border-white/10 text-neutral-300'
                    }`}>
                    <span className={isWinner ? 'text-black' : 'text-[#A3E636]'}>✔ {player.summary.correctCount} CORRECT</span>
                    <span>·</span>
                    <span className={isWinner ? 'text-black' : 'text-[#FF6B6B]'}>✖ {player.summary.incorrectCount} WRONG</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Solo Player Card */
          <div className="flex items-center justify-between border-2 border-black border-l-8 border-l-[#C084FC] bg-[#1f2637] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]">
            <div>
              <span className="border-2 border-black bg-[#C084FC] px-1.5 py-0.5 font-mono text-[10px] sm:text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                FINAL SCORE
              </span>
              <h2 className="mt-1.5 sm:mt-2.5 text-lg sm:text-3xl font-black uppercase text-white">Overall Accuracy</h2>
              <p className="mt-0.5 sm:mt-1 font-mono text-[10px] sm:text-sm font-bold text-neutral-400">
                {results.correctCount} correct out of {results.totalCount} total questions
              </p>
            </div>
            <div className="font-mono text-4xl sm:text-6xl font-black text-[#A3E636]">
              {results.scorePercent}%
            </div>
          </div>
        )}

        {/* 2b. Mastery Feedback Banner (solo practice) */}
        {roomPlayers.length <= 1 && (
          <div
            className={`border-2 border-black p-3 sm:p-4 font-mono text-[10px] font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:text-xs sm:shadow-[4px_4px_0px_0px_#000] ${grammarFeedback.kind === 'mastered' ? 'bg-[#C084FC]' : grammarFeedback.kind === 'passed' ? 'bg-[#A3E636]' : 'bg-[#FF6B6B]'
              }`}
          >
            {grammarFeedback.message}
          </div>
        )}

        {/* 3. Detailed Question Breakdown */}
        <div className="space-y-2.5 sm:space-y-4 pt-1 sm:pt-2">
          <div className="flex items-center justify-between border-b-2 border-white/10 pb-1.5 sm:pb-2">
            <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C084FC]">
              // QUESTION-BY-QUESTION BREAKDOWN ({questions.length} QUESTIONS)
            </span>
          </div>

          {questions.map((question, index) => (
            <div
              key={`question-${index}`}
              className="border-2 border-black bg-[#1f2637] p-3 sm:p-5 shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] space-y-2.5 sm:space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b-2 border-white/10 pb-1.5 sm:pb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="border border-black bg-white px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[10px] sm:text-xs font-black text-black">
                    Q{index + 1}
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400 uppercase">
                    {question.type}
                  </span>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <p className="jp-font text-sm sm:text-lg font-bold text-white leading-snug">
                  {question.prompt}
                </p>
                {question.englishText && (
                  <p className="mt-0.5 sm:mt-1 font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
                    EN: {question.englishText}
                  </p>
                )}
              </div>

              {/* Player Submissions List */}
              <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                {playerResults.map((player, playerIndex) => {
                  const rawAnswer = player.answers[index];
                  const answerText = formatAnswer(question, rawAnswer);
                  const badge = getQuestionResultBadge(question, rawAnswer);
                  const isCorrect = question.type === 'matching'
                    ? badge.className === 'bg-[#A3E636] text-black'
                    : badge.label === 'Correct';

                  return (
                    <div
                      key={`${player.name}-${playerIndex}`}
                      className="flex flex-col justify-between border-2 border-black bg-[#151922] p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] sm:text-xs font-black text-neutral-300">
                          {isRoomMode ? player.name : 'YOUR ANSWER'}
                        </span>
                        <span
                          className={`border border-black px-1.5 py-0.2 sm:py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] ${isCorrect ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
                            }`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="mt-1.5 sm:mt-2">
                        {question.type === 'matching' ? (
                          <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
                            {getMatchingPairStates(question, rawAnswer).map((pair, pIdx) => (
                              <span
                                key={pIdx}
                                className={`border border-black px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[9px] sm:text-[11px] font-black shadow-[1px_1px_0px_0px_#000] ${pair.isCorrect ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
                                  }`}
                              >
                                {pair.left} → {pair.right}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="jp-font text-xs sm:text-sm font-bold text-white">
                            {answerText || <span className="text-neutral-500 font-mono text-[10px] sm:text-xs">[NO ANSWER]</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Official Correct Answer Banner */}
              <div className="border-2 border-black bg-[#A3E636] p-2 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black/70">
                  CORRECT SOLUTION
                </span>
                <p className="jp-font text-xs sm:text-base font-black text-black mt-0.5">
                  {getCorrectAnswerLabel(question)}
                </p>
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div className="border-l-4 border-[#C084FC] pl-2 sm:pl-3 py-0.5">
                  <p className="font-mono text-[10px] sm:text-xs font-semibold text-neutral-300">
                    <span className="text-[#C084FC] font-black uppercase">// NOTE: </span>
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Solo Try Another Set Button */}
        {(!roomPlayers.length || roomPlayers.length === 1) && (
          <LegacyButton
            onClick={handleTryAnotherSet}
            disabled={isGeneratingSet}
            className="w-full border-2 border-black bg-[#C084FC] py-3 sm:py-5 font-black uppercase tracking-wider text-xs sm:text-sm text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:bg-[#cb9afc] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          >
            {isGeneratingSet ? 'Generating New Set...' : 'Try Another Set →'}
          </LegacyButton>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 sm:space-y-4 px-3 py-3 sm:px-4 sm:py-4 pb-20 sm:pb-24">
      <GrammarPracticeHeader
        sessionLabel={sessionLabel}
        lesson={currentQuestion?.lesson}
        currentIndex={visibleIndex}
        questionCount={questions.length}
        progress={progress}
      />

      {onForfeit && (
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowForfeitConfirmation(true)} className="border-2 border-black bg-[#FF6B6B] px-2 py-1 font-mono text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000]">
            Forfeit Match
          </button>
        </div>
      )}

      {showForfeitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="grammar-forfeit-title">
          <div className="w-full max-w-sm border-2 border-black bg-[#1f2637] p-5 text-white shadow-[6px_6px_0px_0px_#000]">
            <h2 id="grammar-forfeit-title" className="font-mono text-lg font-black uppercase">Forfeit match?</h2>
            <p className="mt-2 font-mono text-xs text-neutral-300">This will count as a loss and award the win to your opponent.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForfeitConfirmation(false)} className="border-2 border-black bg-white px-3 py-2 font-mono text-xs font-black uppercase text-black">Cancel</button>
              <button type="button" onClick={() => { setShowForfeitConfirmation(false); onForfeit?.(); }} className="border-2 border-black bg-[#FF6B6B] px-3 py-2 font-mono text-xs font-black uppercase text-black">Forfeit Match</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Question & Interactive Arena Card */}
      <div className="relative overflow-hidden border-2 border-black bg-[#1f2637] p-3.5 sm:p-7 shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]">
        <GrammarQuestionPrompt question={currentQuestion} />

        {/* Choices / Input Area */}
        <div className="mt-3.5 sm:mt-6">
          {(currentQuestion?.type === 'multiple-choice' || currentQuestion?.type === 'comprehension') && (
            <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2">
              {currentQuestion.choices?.map((choice) => {
                const isSelected = answers[visibleIndex] === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => handleSelectAnswer(visibleIndex, choice)}
                    className={`jp-font flex items-center justify-between border-2 border-black px-3 py-2.5 sm:px-4 sm:py-3.5 text-sm sm:text-base font-black transition-all ${isSelected
                      ? 'translate-x-[1px] translate-y-[1px] bg-[#C084FC] text-black shadow-none ring-2 ring-black'
                      : 'bg-[#151922] text-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] hover:bg-[#252c3d] active:translate-x-[1px] active:translate-y-[1px]'
                      }`}
                  >
                    <span>{choice}</span>
                  {/* {isSelected && <span className="font-mono text-xs sm:text-sm">✓</span>} */}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion?.type === 'fill-in-the-blank' && (
            <div className="mx-auto w-full max-w-md space-y-1.5 sm:space-y-2">
              <div className="relative">
                <LegacyInput
                  autoFocus
                  value={answers[visibleIndex] ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSelectAnswer(visibleIndex, e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && hasCurrentAnswer && !isCurrentPlayerReady) {
                      handleNext();
                    }
                  }}
                  placeholder="Type your answer..."
                  className="jp-font h-10 sm:h-14 w-full border-2 border-black bg-[#151922] px-3 sm:px-4 text-center text-base sm:text-xl font-black text-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm placeholder:font-bold placeholder:text-neutral-500 focus-visible:bg-[#252c3d] focus-visible:ring-1 focus-visible:ring-[#C084FC] focus-visible:ring-offset-0 focus:outline-none"
                />
              </div>
              <p className="text-center font-mono text-[10px] sm:text-[11px] font-bold text-neutral-400">
                PRESS [ENTER] TO SUBMIT
              </p>
            </div>
          )}

          {currentQuestion?.type === 'translation' && (
            <div className="mx-auto w-full max-w-lg mt-3 sm:mt-6 space-y-2 sm:space-y-3">
              <div className="relative">
                <LegacyInput
                  autoFocus
                  value={answers[visibleIndex] ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleSelectAnswer(visibleIndex, e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && hasCurrentAnswer && !isCurrentPlayerReady) {
                      handleNext();
                    }
                  }}
                  placeholder="日本語で入力... (Romaji / Kana)"
                  className="jp-font h-10 sm:h-14 w-full border-2 border-black bg-[#151922] px-3 sm:px-4 text-center text-sm sm:text-xl font-bold text-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm placeholder:font-medium placeholder:text-neutral-500 focus-visible:bg-[#252c3d] focus-visible:ring-1 focus-visible:ring-[#C084FC] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between px-1 font-mono text-[9px] sm:text-[11px] font-bold text-neutral-400">
                <span>SUPPORTS ROMAJI &amp; KANA</span>
                <span>PRESS [ENTER] TO SUBMIT</span>
              </div>
            </div>
          )}

          {/* Matching Type UI */}
          {currentQuestion?.type === 'matching' && (
            <div className="space-y-3 sm:space-y-5">
              <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
                {/* LEFT COLUMN */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-[#C084FC]">
                      // 01: SELECT DIGIT
                    </span>
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-400">
                      {currentQuestion.leftItems?.filter(item => getMatchingSelection(visibleIndex).pairs.some(p => p.left === item)).length} / {currentQuestion.leftItems?.length} PAIRED
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {currentQuestion.leftItems?.map((item) => {
                      const selected = getMatchingSelection(visibleIndex).selectedLeft === item;
                      const paired = getMatchingSelection(visibleIndex).pairs.some((p) => p.left === item);

                      return (
                        <button
                          key={item}
                          disabled={paired || isCurrentPlayerReady}
                          onClick={() => handleMatchingSelectLeft(visibleIndex, item)}
                          className={`flex w-full items-center justify-between border-2 border-black p-2.5 sm:p-3.5 text-left font-black transition-all ${paired
                            ? 'border-white/10 bg-[#151922] text-neutral-600 opacity-50 line-through cursor-not-allowed shadow-none'
                            : selected
                              ? 'translate-x-[1px] translate-y-[1px] bg-[#C084FC] text-black shadow-none ring-2 ring-black'
                              : 'bg-[#151922] text-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] hover:bg-[#252c3d] active:translate-x-[1px] active:translate-y-[1px]'
                            }`}
                        >
                          <span className="text-xs sm:text-base">{item}</span>
                          {paired ? (
                            <span className="font-mono text-[9px] sm:text-xs font-bold text-neutral-500 no-underline">PAIRED</span>
                          ) : selected ? (
                            <span className="font-mono text-[9px] sm:text-xs font-black">ACTIVE</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-[#A3E636]">
                      // 02: SELECT HIRAGANA
                    </span>
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-400">
                      {currentQuestion.rightItems?.filter(item => getMatchingSelection(visibleIndex).pairs.some(p => p.right === item)).length} / {currentQuestion.rightItems?.length} PAIRED
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {currentQuestion.rightItems?.map((item) => {
                      const selected = getMatchingSelection(visibleIndex).selectedRight === item;
                      const paired = getMatchingSelection(visibleIndex).pairs.some((p) => p.right === item);

                      return (
                        <button
                          key={item}
                          disabled={paired || isCurrentPlayerReady}
                          onClick={() => handleMatchingSelectRight(visibleIndex, item)}
                          className={`jp-font flex w-full items-center justify-between border-2 border-black p-2.5 sm:p-3.5 text-left font-black transition-all ${paired
                            ? 'border-white/10 bg-[#151922] text-neutral-600 opacity-50 line-through cursor-not-allowed shadow-none'
                            : selected
                              ? 'translate-x-[1px] translate-y-[1px] bg-[#A3E636] text-black shadow-none ring-2 ring-black'
                              : 'bg-[#151922] text-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] hover:bg-[#252c3d] active:translate-x-[1px] active:translate-y-[1px]'
                            }`}
                        >
                          <span className="text-xs sm:text-base">{item}</span>
                          {paired ? (
                            <span className="font-mono text-[9px] sm:text-xs font-bold text-neutral-500 no-underline">PAIRED</span>
                          ) : selected ? (
                            <span className="font-mono text-[9px] sm:text-xs font-black">ACTIVE</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Active Pairs Tray */}
              <div className="border-2 border-black bg-[#151922] p-3 sm:p-4 shadow-[2px_2px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C084FC]">
                    // CONNECTED PAIRS ({getMatchingSelection(visibleIndex).pairs.length}/{currentQuestion.leftItems?.length || 0})
                  </span>

                  {getMatchingSelection(visibleIndex).pairs.length > 0 && (
                    <LegacyButton
                      size="sm"
                      onClick={() => handleUndoMatching(visibleIndex)}
                      disabled={isCurrentPlayerReady}
                      className="border-2 border-black bg-[#FF6B6B] px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] hover:bg-[#ff8585] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      Undo All
                    </LegacyButton>
                  )}
                </div>

                {getMatchingSelection(visibleIndex).pairs.length === 0 ? (
                  <p className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
                    Click an item on the left, then click its corresponding match on the right.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {getMatchingSelection(visibleIndex).pairs.map((pair, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 border-2 border-black bg-white px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-[10px] sm:text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]"
                      >
                        <span>{pair.left}</span>
                        <span className="text-[#C084FC] font-black">→</span>
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
        <div className="mt-5 sm:mt-8 flex flex-col gap-3 border-t-2 border-white/10 pt-3 sm:pt-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Opponent Presence Bar */}
          {room && otherPlayer ? (
            <div className="inline-flex items-center gap-2 border-2 border-black bg-[#151922] px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
              <button
                type="button"
                role="switch"
                aria-checked={showOpponentStatus}
                onClick={() => setShowOpponentStatus((prev) => !prev)}
                className="group relative inline-flex cursor-pointer items-center select-none focus:outline-none"
              >
                <div
                  className={`flex h-5 w-9 sm:h-6 sm:w-11 items-center border-2 border-black p-0.5 transition-colors duration-150 ${showOpponentStatus ? 'bg-[#C084FC]' : 'bg-[#181a20]'
                    }`}
                >
                  <div
                    className={`h-3 w-3 sm:h-4 sm:w-4 border-2 border-black bg-white shadow-none transition-transform duration-150 ${showOpponentStatus ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </div>
              </button>

              <div className="flex items-center gap-1 font-mono text-[10px] sm:text-xs font-bold text-white">
                <span className="text-neutral-400">VS</span>
                <span className="font-black text-white truncate">{otherPlayer.name}:</span>
                {showOpponentStatus ? (
                  <span className="flex items-center gap-1 text-[#C084FC]">
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
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3">
            <span className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
              {hasCurrentAnswer ? (isCurrentPlayerReady ? 'READY' : 'ANSWERED') : 'SELECT AN OPTION'}
            </span>

            <LegacyButton
              onClick={handleNext}
              disabled={!hasCurrentAnswer || isCurrentPlayerReady}
              className={`border-2 border-black px-4 py-2 sm:px-6 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider text-black transition-all ${!hasCurrentAnswer || isCurrentPlayerReady
                ? 'bg-[#151922] text-neutral-500 opacity-60 shadow-none cursor-not-allowed'
                : 'bg-white shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:bg-[#C084FC] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
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
            </LegacyButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GrammarPractice;