import { useEffect, useState } from 'react';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { getKanjiGroup, saveKanjiQuizResult } from '../../../services/api';
import type { KanjiCard } from '../../../types';
import useActivityRecorder from '../../../hooks/useActivityRecorder';

type Card = KanjiCard & { id: string; reading?: string; meaning?: string };
type Question = { card: Card; options: string[] };
type Props = { groupId: string; groupName: string; onBack: () => void; onComplete: () => void };
type QuizResultPayload = { groupId: string; score: number; totalQuestions: number; passed: boolean };

const PENDING_RESULT_KEY = 'ganbatte-pending-kanji-quiz-results';

function readPendingResults(): QuizResultPayload[] {
  try {
    const stored = localStorage.getItem(PENDING_RESULT_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as QuizResultPayload[]) : [];
  } catch {
    return [];
  }
}

function writePendingResults(results: QuizResultPayload[]) {
  try {
    localStorage.setItem(PENDING_RESULT_KEY, JSON.stringify(results));
  } catch (error) {
    console.warn('Unable to cache Kanji quiz result:', error);
  }
}

function cacheResult(payload: QuizResultPayload) {
  const pending = readPendingResults().filter((result) => result.groupId !== payload.groupId);
  writePendingResults([...pending, payload]);
}

async function syncResult(payload: QuizResultPayload) {
  try {
    await saveKanjiQuizResult(payload);
    writePendingResults(readPendingResults().filter((result) => result.groupId !== payload.groupId));
  } catch (error) {
    console.warn('Kanji quiz result sync deferred:', error);
  }
}

async function retryPendingResults() {
  await Promise.all(readPendingResults().map(syncResult));
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function shuffle<T>(values: T[]) {
  return [...values].sort(() => Math.random() - 0.5);
}

function createQuestions(items: Card[]): Question[] {
  const selectedItems = shuffle(items).slice(0, 10);
  return selectedItems.map((card) => ({
    card,
    options: shuffle([
      card.reading || '',
      ...shuffle(selectedItems.filter((candidate) => candidate.id !== card.id))
        .map((candidate) => candidate.reading || '')
        .filter(Boolean)
        .slice(0, 3),
    ]),
  }));
}

export default function KanjiGroupQuiz({ groupId, groupName, onBack, onComplete }: Props) {
  const { recordActivity } = useActivityRecorder();
  const [cards, setCards] = useState<Card[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState<Question[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const question = questions[questionIndex];
  const score = correctCount;
  const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  useEffect(() => {
    void retryPendingResults();
    const handleOnline = () => {
      void retryPendingResults();
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    getKanjiGroup(groupId)
      .then((data) => {
        const items = (data.items || []).filter((item): item is Card => Boolean(item.id && item.reading));
        setCards(items);
        setQuestions(createQuestions(items));
      })
      .catch(() => setLoadError('Unable to load this Kanji quiz.'))
      .finally(() => setIsLoading(false));
  }, [groupId]);

  useEffect(() => {
    if (isComplete) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isComplete, startedAt]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer || !question) return;
    setSelectedAnswer(answer);
    if (answer === question.card.reading) {
      setCorrectCount((current) => current + 1);
    } else {
      setMissedQuestions((current) => [...current, question]);
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) return;
    if (questionIndex >= questions.length - 1) {
      const finalElapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const finalScore = correctCount;
      const finalPassed = finalScore / questions.length >= 0.8;
      const payload = { groupId, score: finalScore, totalQuestions: questions.length, passed: finalPassed };
      setElapsedSeconds(finalElapsedSeconds);
      cacheResult(payload);
      void syncResult(payload);
      void recordActivity();
      setIsComplete(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
  };

  const handleRetry = () => {
    setQuestions(createQuestions(cards));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setMissedQuestions([]);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setIsComplete(false);
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="border-2 border-black bg-[#151922] p-8 text-center font-mono text-xs font-black uppercase text-white shadow-[4px_4px_0px_0px_#000] sm:p-12 sm:text-sm">
          Loading quiz...
        </div>
      </main>
    );
  }

  if (loadError || !questions.length) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        <section className="border-2 border-black border-l-8 border-l-[#FF6B6B] bg-[#1f2637] p-6 text-white shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000]">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#FF6B6B] sm:text-xs">
            // ERROR
          </span>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Quiz Unavailable
          </h1>
          <p className="mt-2 font-mono text-xs font-bold uppercase text-neutral-300 sm:text-sm">
            {loadError || 'This group does not contain enough Kanji.'}
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 cursor-pointer border-2 border-black bg-white px-5 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#70CFF8] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
          >
            Return to Group Map
          </button>
        </section>
      </main>
    );
  }

  // --- RESULTS SCREEN ---
  if (isComplete) {
    const passed = score / questions.length >= 0.8;
    const isMastered = passed && cards.length > 0 && cards.every((cardItem) => (cardItem.progress?.srs_stage || 0) >= 4);

    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 pb-20 sm:space-y-6 sm:px-4 sm:py-6 sm:pb-28">
        {/* Main Result Card */}
        <section
          className={`border-2 border-black border-l-8 bg-[#1f2637] p-5 text-white shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000] ${passed ? 'border-l-[#70CFF8]' : 'border-l-[#FF6B6B]'
            }`}
        >
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#70CFF8] sm:text-xs">
            {groupName} // QUIZ COMPLETE
          </span>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
            Practice Results
          </h1>

          {/* Pass / Fail Status Banner */}
          <div
            className={`mt-4 border-2 border-black p-3 text-center font-mono text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] sm:p-3.5 sm:text-sm ${passed ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
              }`}
          >
            {passed
              ? isMastered
                ? '★ GROUP MASTERED! CROWN BADGE UNLOCKED'
                : '✓ GROUP CLEARED! SILVER BADGE UNLOCKED'
              : 'TRY AGAIN (80% REQUIRED TO CLEAR GROUP)'}
          </div>

          {/* Score Metrics Grid */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <div className="border-2 border-black bg-[#151922] p-3 text-center shadow-[2px_2px_0px_0px_#000] sm:p-4">
              <span className="font-mono text-[8px] font-black uppercase tracking-wider text-neutral-400 sm:text-[10px]">
                Score
              </span>
              <strong className="mt-1 block font-mono text-xl font-black text-white sm:text-3xl">
                {score}/{questions.length}
              </strong>
            </div>
            <div className="border-2 border-black bg-[#151922] p-3 text-center shadow-[2px_2px_0px_0px_#000] sm:p-4">
              <span className="font-mono text-[8px] font-black uppercase tracking-wider text-neutral-400 sm:text-[10px]">
                Accuracy
              </span>
              <strong
                className={`mt-1 block font-mono text-xl font-black sm:text-3xl ${passed ? 'text-[#A3E636]' : 'text-[#FF6B6B]'
                  }`}
              >
                {accuracy}%
              </strong>
            </div>
            <div className="border-2 border-black bg-[#151922] p-3 text-center shadow-[2px_2px_0px_0px_#000] sm:p-4">
              <span className="font-mono text-[8px] font-black uppercase tracking-wider text-neutral-400 sm:text-[10px]">
                Elapsed
              </span>
              <strong className="mt-1 block font-mono text-xl font-black text-[#70CFF8] sm:text-3xl">
                {formatElapsed(elapsedSeconds)}
              </strong>
            </div>
          </div>
        </section>

        {/* Missed Kanji Section */}
        {missedQuestions.length > 0 && (
          <section className="border-2 border-black border-l-8 border-l-[#FF6B6B] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] sm:p-6 sm:shadow-[5px_5px_0px_0px_#000]">
            <h2 className="font-mono text-[10px] font-black uppercase tracking-wider text-[#FF6B6B] sm:text-xs">
              MISSED KANJI // REVIEW AGAIN
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-2.5">
              {missedQuestions.map((missed) => (
                <div
                  key={missed.card.id}
                  className="border-2 border-black bg-[#151922] p-2.5 shadow-[2px_2px_0px_0px_#000] sm:p-3"
                >
                  <div className="flex items-baseline justify-between gap-2 border-b border-white/10 pb-1.5">
                    <span className="jp-font text-2xl font-black text-white sm:text-3xl">
                      {missed.card.kanji}
                    </span>
                    <span className="font-mono text-xs font-black text-[#70CFF8]">
                      {missed.card.reading}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-xs font-bold text-neutral-300">
                    {missed.card.meaning}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Actions */}
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="cursor-pointer border-2 border-black bg-[#70CFF8] px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
          >
            Retry Quiz ↺
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="cursor-pointer border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-neutral-100 hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
          >
            Return to Group Map →
          </button>
        </div>
      </main>
    );
  }

  // --- ACTIVE QUIZ QUESTION SCREEN ---
  const isCorrect = selectedAnswer === question.card.reading;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-3.5 px-3 py-4 sm:space-y-5 sm:px-4 sm:py-6 sm:pb-28">
      {/* Header */}
      <header className="flex items-center justify-between gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
          title="Return to Kanji group map"
          aria-label="Return to Kanji group map"
        >
          <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
        </button>
        <div className="text-right">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#70CFF8] sm:text-xs">
            {groupName} // PRACTICE QUIZ
          </span>
          <h1 className="text-lg font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
            Kanji Check
          </h1>
        </div>
      </header>

      {/* Main Question Container */}
      <section className="border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]">
        {/* Question Counter & Timer */}
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 font-mono text-[10px] font-black uppercase text-neutral-300 sm:text-xs">
          <span>
            QUESTION {questionIndex + 1} OF {questions.length}
          </span>
          <span className="text-[#70CFF8]">{formatElapsed(elapsedSeconds)}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-3.5 overflow-hidden border-2 border-black bg-[#151922] shadow-[1px_1px_0px_0px_#000] sm:h-4">
          <div
            className="h-full bg-[#70CFF8] transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Kanji Prompt Display Stage */}
        <div className="my-4 flex flex-col items-center justify-center border-2 border-black bg-[#151922] py-8 text-center shadow-[3px_3px_0px_0px_#000] sm:my-5 sm:py-10">
          <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#70CFF8] sm:text-[10px]">
            SELECT THE KANA READING
          </span>
          <h2 className="jp-font mt-3 text-7xl font-black leading-none text-white sm:text-9xl">
            {question.card.kanji}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isAnswer = option === question.card.reading;

            let optionStyle = 'bg-[#151922] text-white hover:bg-[#252c3d] hover:border-white/30';
            if (selectedAnswer) {
              if (isAnswer) {
                optionStyle = 'bg-[#A3E636] text-black shadow-[2px_2px_0px_0px_#000]';
              } else if (isSelected) {
                optionStyle = 'bg-[#FF6B6B] text-black shadow-[2px_2px_0px_0px_#000]';
              } else {
                optionStyle = 'bg-[#151922] text-neutral-500 opacity-60';
              }
            }

            return (
              <button
                key={option}
                type="button"
                disabled={Boolean(selectedAnswer)}
                onClick={() => handleAnswer(option)}
                className={`flex min-h-[52px] cursor-pointer items-center justify-between border-2 border-black p-3 text-left font-mono text-sm font-black shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-default sm:min-h-[60px] sm:p-3.5 sm:text-base ${optionStyle}`}
              >
                <span>{option}</span>
                {selectedAnswer && isAnswer && <CheckCircledIcon className="h-5 w-5 text-black" />}
                {selectedAnswer && isSelected && !isAnswer && <CrossCircledIcon className="h-5 w-5 text-black" />}
              </button>
            );
          })}
        </div>

        {/* Incorrect Banner Message */}
        {selectedAnswer && !isCorrect && (
          <div className="mt-3.5 border-2 border-black bg-[#FF6B6B] p-2.5 text-center font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:p-3">
            CORRECT ANSWER: {question.card.reading}
          </div>
        )}

        {/* Next Question / Finish Action Button */}
        <button
          type="button"
          disabled={!selectedAnswer}
          onClick={handleNext}
          className={`mt-4 w-full border-2 border-black py-2.5 font-mono text-xs font-black uppercase tracking-wider transition-all sm:mt-5 sm:py-3 sm:text-sm ${selectedAnswer
              ? 'cursor-pointer bg-white text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#70CFF8] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
              : 'cursor-not-allowed bg-[#151922] text-neutral-600 opacity-50 shadow-none'
            }`}
        >
          {questionIndex === questions.length - 1 ? 'Finish Quiz →' : 'Next Question →'}
        </button>
      </section>
    </main>
  );
}