import { useEffect, useState } from 'react';
import { CheckCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { getKanjiGroup, saveKanjiQuizResult } from '../../services/api';
import type { KanjiCard } from '../../types';
import useActivityRecorder from '../../hooks/useActivityRecorder';

type Card = KanjiCard & { id: string; reading?: string; meaning?: string };
type Question = { card: Card; options: string[] };
type Props = { groupId: string; groupName: string; onBack: () => void; onComplete: () => void };
type QuizResultPayload = { groupId: string; score: number; totalQuestions: number; passed: boolean };

const PENDING_RESULT_KEY = 'ganbatte-pending-kanji-quiz-results';

function readPendingResults(): QuizResultPayload[] {
  try {
    const stored = localStorage.getItem(PENDING_RESULT_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as QuizResultPayload[] : [];
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
    const handleOnline = () => { void retryPendingResults(); };
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
      // Kanji session complete — record cross-device activity for streaks/tiers.
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

  if (isLoading) return <main className="mx-auto max-w-3xl px-4 py-8"><div className="border-2 border-black bg-[#151922] p-10 text-center font-mono text-xs font-black uppercase text-white">Loading quiz...</div></main>;
  if (loadError || !questions.length) return <main className="mx-auto w-full max-w-3xl px-4 py-8"><section className="border-2 border-black bg-[#FF6B6B] p-8 text-center text-black shadow-[6px_6px_0px_#000]"><h1 className="text-2xl font-black uppercase">Quiz unavailable</h1><p className="mt-2 font-mono text-xs font-bold uppercase">{loadError || 'This group does not contain enough Kanji.'}</p><button type="button" onClick={onBack} className="mt-6 border-2 border-black bg-white px-4 py-3 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000]">Return to Group Map</button></section></main>;

  if (isComplete) {
    const passed = score / questions.length >= 0.8;
    const isMastered = passed && cards.length > 0 && cards.every((cardItem) => (cardItem.progress?.srs_stage || 0) >= 4);
    return (
      <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:space-y-7 sm:py-8">
        <section className="border-2 border-black bg-[#A3E636] p-6 text-black shadow-[6px_6px_0px_#000] sm:p-10">
          <span className="font-mono text-xs font-black uppercase tracking-wider">{groupName} // Quiz Complete</span>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl">Practice Results</h1>
          <div className={`mt-5 border-2 border-black p-4 text-center font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000] ${passed ? 'bg-white' : 'bg-[#FF6B6B]'}`}>
            {passed ? (isMastered ? 'GROUP MASTERED! CROWN BADGE UNLOCKED' : 'GROUP CLEARED! SILVER BADGE UNLOCKED') : 'TRY AGAIN (80% REQUIRED TO CLEAR GROUP)'}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_#000]"><span className="font-mono text-[10px] font-black uppercase">Score</span><strong className="mt-1 block text-2xl font-black">{score}/{questions.length}</strong></div>
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_#000]"><span className="font-mono text-[10px] font-black uppercase">Accuracy</span><strong className="mt-1 block text-2xl font-black">{accuracy}%</strong></div>
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_#000]"><span className="font-mono text-[10px] font-black uppercase">Elapsed</span><strong className="mt-1 block text-2xl font-black">{formatElapsed(elapsedSeconds)}</strong></div>
          </div>
        </section>
        {missedQuestions.length > 0 && <section className="border-2 border-black bg-[#FF6B6B] p-5 text-black shadow-[4px_4px_0px_#000] sm:p-7"><h2 className="font-mono text-xs font-black uppercase tracking-wider">Missed Kanji // Review Again</h2><div className="mt-4 space-y-3">{missedQuestions.map((missed) => <div key={missed.card.id} className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_#000]"><div className="flex flex-wrap items-baseline justify-between gap-2"><span className="jp-font text-2xl font-black">{missed.card.kanji}</span><span className="font-mono text-xs font-black">{missed.card.reading}</span></div><p className="mt-1 text-sm font-bold">{missed.card.meaning}</p></div>)}</div></section>}
        <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={handleRetry} className="border-2 border-black bg-[#70CFF8] px-4 py-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_#000] hover:bg-[#8bd9fa]">Retry Quiz</button><button type="button" onClick={onComplete} className="border-2 border-black bg-white px-4 py-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_#000] hover:bg-neutral-100">Return to Group Map</button></div>
      </main>
    );
  }

  const isCorrect = selectedAnswer === question.card.reading;
  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:space-y-7 sm:py-8">
      <header className="flex items-center justify-between gap-3"><button type="button" onClick={onBack} className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2pxpx_#000] sm:h-11 sm:w-11" aria-label="Return to Kanji group map"><span className="font-mono text-base font-black sm:text-lg">&lt;</span></button><div className="text-right"><span className="font-mono text-[10px] font-black uppercase text-[#FFDE59]">{groupName} // Practice Quiz</span><h1 className="text-xl font-black uppercase text-white sm:text-3xl">Kanji Check</h1></div></header>
      <section className="border-2 border-black bg-[#FFDE59] p-5 text-black shadow-[6px_6px_0px_#000] sm:p-8"><div className="flex items-center justify-between gap-3 border-b-2 border-black pb-3 font-mono text-xs font-black uppercase"><span>Question {questionIndex + 1} of {questions.length}</span><span>{formatElapsed(elapsedSeconds)}</span></div><div className="mt-5 h-4 border-2 border-black bg-white"><div className="h-full bg-[#70CFF8] transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><div className="py-10 text-center"><span className="font-mono text-[10px] font-black uppercase text-black/60">Select the kana reading</span><h2 className="jp-font mt-4 text-6xl font-black sm:text-8xl">{question.card.kanji}</h2></div><div className="grid gap-3 sm:grid-cols-2">{question.options.map((option) => { const isSelected = selectedAnswer === option; const isAnswer = option === question.card.reading; const feedbackClass = selectedAnswer && isAnswer ? 'bg-[#A3E636]' : selectedAnswer && isSelected ? 'bg-[#FF6B6B]' : 'bg-white hover:bg-neutral-100'; return <button key={option} type="button" disabled={Boolean(selectedAnswer)} onClick={() => handleAnswer(option)} className={`min-h-16 border-2 border-black p-3 text-left font-mono text-sm font-black shadow-[3px_3px_0px_#000] ${feedbackClass}`}>{selectedAnswer && isAnswer && <CheckCircledIcon className="mr-2 inline h-4 w-4" />}{selectedAnswer && isSelected && !isAnswer && <ExclamationTriangleIcon className="mr-2 inline h-4 w-4" />}{option}</button>; })}</div>{selectedAnswer && !isCorrect && <p className="mt-4 border-2 border-black bg-[#FF6B6B] p-3 text-center font-mono text-xs font-black uppercase">Correct answer: {question.card.reading}</p>}<button type="button" disabled={!selectedAnswer} onClick={handleNext} className="mt-5 w-full border-2 border-black bg-black px-4 py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50">{questionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question →'}</button></section>
    </main>
  );
}
