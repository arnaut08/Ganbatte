import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircledIcon, ExclamationTriangleIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';
import { markVocabAgain, saveStageQuizResult, type SaveStageQuizPayload } from '../../../services/api';
import type { VocabStudyItem } from '../../../types';
import { generateVocabQuiz, type VocabQuizQuestion } from '../../../utils/quizGenerator';
import useActivityRecorder from '../../../hooks/useActivityRecorder';

function renderFurigana(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  const pattern = /([\p{Script=Han}]+)\[([^\]]+)\]/gu;
  let lastIndex = 0;
  let match = pattern.exec(text);
  while (match) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(<ruby key={`${match.index}-${match[1]}`}><span>{match[1]}</span><rt>{match[2]}</rt></ruby>);
    lastIndex = match.index + match[0].length;
    match = pattern.exec(text);
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return <>{nodes}</>;
}

type VocabStageQuizProps = {
  level: string;
  stageNumber: number;
  items: VocabStudyItem[];
  onBackToStageMap: () => void;
};

const PENDING_RESULT_KEY = 'ganbatte-pending-stage-quiz-results';

function readPendingResults(): SaveStageQuizPayload[] {
  try {
    const stored = localStorage.getItem(PENDING_RESULT_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as SaveStageQuizPayload[] : [];
  } catch {
    return [];
  }
}

function writePendingResults(results: SaveStageQuizPayload[]) {
  try {
    localStorage.setItem(PENDING_RESULT_KEY, JSON.stringify(results));
  } catch (error) {
    console.warn('Unable to cache stage quiz result:', error);
  }
}

function cacheResult(payload: SaveStageQuizPayload) {
  const resultKey = `${payload.level}:${payload.stageNumber}`;
  const pending = readPendingResults().filter((result) => `${result.level}:${result.stageNumber}` !== resultKey);
  writePendingResults([...pending, payload]);
}

async function syncResult(payload: SaveStageQuizPayload) {
  try {
    await saveStageQuizResult(payload);
    const resultKey = `${payload.level}:${payload.stageNumber}`;
    writePendingResults(readPendingResults().filter((result) => `${result.level}:${result.stageNumber}` !== resultKey));
  } catch (error) {
    console.warn('Stage quiz result sync deferred:', error);
  }
}

async function retryPendingResults() {
  const pending = readPendingResults();
  await Promise.all(pending.map(syncResult));
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  window.speechSynthesis.speak(utterance);
}

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function VocabStageQuiz({ level, stageNumber, items, onBackToStageMap }: VocabStageQuizProps) {
  const { recordActivity } = useActivityRecorder();
  const [questions, setQuestions] = useState<VocabQuizQuestion[]>(() => generateVocabQuiz(items));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedQuestions, setMissedQuestions] = useState<VocabQuizQuestion[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isMarkingAgain, setIsMarkingAgain] = useState(false);

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
    if (isComplete) return undefined;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isComplete, startedAt]);

  useEffect(() => {
    if (question?.type === 'japanese-to-english') speak(question.vocab.kana);
  }, [question]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer || !question || isMarkingAgain) return;
    setSelectedAnswer(answer);
    const isCorrect = answer === question.correctAnswer;
    if (isCorrect) {
      setCorrectCount((current) => current + 1);
      return;
    }

    setMissedQuestions((current) => [...current, question]);
    setIsMarkingAgain(true);
    markVocabAgain(question.vocab.id)
      .catch((error) => console.warn('Vocabulary review marker sync deferred:', error))
      .finally(() => setIsMarkingAgain(false));
  };

  const handleNext = () => {
    if (!selectedAnswer) return;
    if (questionIndex >= questions.length - 1) {
      const finalElapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      const finalScore = correctCount;
      const finalPassed = finalScore / questions.length >= 0.8;
      setElapsedSeconds(finalElapsedSeconds);
      const payload = { level, stageNumber, score: finalScore, totalQuestions: questions.length, passed: finalPassed };
      cacheResult(payload);
      void syncResult(payload);
      // Vocab stage clear — record cross-device activity for streaks/tiers.
      if (finalPassed) void recordActivity();
      setIsComplete(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
    setSelectedAnswer(null);
  };

  const handleRetry = () => {
    setQuestions(generateVocabQuiz(items));
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setMissedQuestions([]);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setIsComplete(false);
  };

  if (!questions.length) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <section className="border-2 border-black bg-[#FF6B6B] p-8 text-center text-black shadow-[6px_6px_0px_0px_#000]">
          <h1 className="text-2xl font-black uppercase">Quiz unavailable</h1>
          <p className="mt-2 font-mono text-xs font-bold uppercase">This stage does not contain enough vocabulary.</p>
          <button type="button" onClick={onBackToStageMap} className="mt-6 border-2 border-black bg-white px-4 py-3 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Return to Stage Map</button>
        </section>
      </main>
    );
  }

  if (isComplete) {
    const passed = score / questions.length >= 0.8;
    const isMastered = passed && items.length > 0 && items.every((item) => (item.progress?.srs_stage || 0) >= 4);
    return (
      <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:space-y-7 sm:py-8">
        <section className="border-2 border-black bg-[#A3E636] p-6 text-black shadow-[6px_6px_0px_0px_#000] sm:p-10">
          <span className="font-mono text-xs font-black uppercase tracking-wider">Stage {stageNumber} // Quiz Complete</span>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl">Practice Results</h1>
          <div className={`mt-5 border-2 border-black p-4 text-center font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000] ${passed ? 'bg-white' : 'bg-[#FF6B6B]'}`}>
            {passed ? (isMastered ? 'STAGE MASTERED! CROWN BADGE UNLOCKED' : 'STAGE CLEARED! SILVER BADGE UNLOCKED') : 'TRY AGAIN (80% REQUIRED TO CLEAR STAGE)'}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]"><span className="font-mono text-[10px] font-black uppercase">Score</span><strong className="mt-1 block text-2xl font-black">{score}/{questions.length}</strong></div>
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]"><span className="font-mono text-[10px] font-black uppercase">Accuracy</span><strong className="mt-1 block text-2xl font-black">{accuracy}%</strong></div>
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]"><span className="font-mono text-[10px] font-black uppercase">Elapsed</span><strong className="mt-1 block text-2xl font-black">{formatElapsed(elapsedSeconds)}</strong></div>
          </div>
        </section>

        {missedQuestions.length > 0 && (
          <section className="border-2 border-black bg-[#FF6B6B] p-5 text-black shadow-[4px_4px_0px_0px_#000] sm:p-7">
            <h2 className="font-mono text-xs font-black uppercase tracking-wider">Missed Words // Review Again</h2>
            <div className="mt-4 space-y-3">
              {missedQuestions.map((missed) => (
                <div key={missed.id} className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000]">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="jp-font text-xl font-black">{renderFurigana(missed.vocab.furigana || missed.vocab.kanji)}</span>
                    <span className="font-mono text-xs font-black">{missed.vocab.kana}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold">{missed.vocab.english.join(' / ')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={handleRetry} className="border-2 border-black bg-[#70CFF8] px-4 py-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#8bd9fa] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Retry Quiz</button>
          <button type="button" onClick={onBackToStageMap} className="border-2 border-black bg-white px-4 py-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">Return to Stage Map</button>
        </div>
      </main>
    );
  }

  const isCorrect = selectedAnswer === question.correctAnswer;
  const promptJapanese = question.type === 'japanese-to-english';

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:space-y-7 sm:py-8">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBackToStageMap} className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11" aria-label="Return to vocabulary stage map"><span className="font-mono text-base font-black sm:text-lg">&lt;</span></button>
        <div className="text-right"><span className="font-mono text-[10px] font-black uppercase text-[#FFDE59]">Stage {stageNumber} // Practice Quiz</span><h1 className="text-xl font-black uppercase text-white sm:text-3xl">Vocabulary Check</h1></div>
      </header>

      <section className="border-2 border-black bg-[#FFDE59] p-5 text-black shadow-[6px_6px_0px_0px_#000] sm:p-8">
        <div className="flex items-center justify-between gap-3 border-b-2 border-black pb-3 font-mono text-xs font-black uppercase"><span>Question {questionIndex + 1} of {questions.length}</span><span>{formatElapsed(elapsedSeconds)}</span></div>
        <div className="mt-5 h-4 border-2 border-black bg-white"><div className="h-full bg-[#70CFF8] transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
        <div className="py-10 text-center">
          <span className="font-mono text-[10px] font-black uppercase text-black/60">{promptJapanese ? 'Select the English meaning' : 'Select the Japanese word'}</span>
          <div className="mt-4 flex items-center justify-center gap-3">
            <h2 className={promptJapanese ? 'jp-font text-5xl font-black sm:text-7xl' : 'text-2xl font-black sm:text-4xl'}>{promptJapanese ? renderFurigana(question.vocab.furigana || question.prompt) : question.prompt}</h2>
            {promptJapanese && <button type="button" onClick={() => speak(question.vocab.kana)} className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none" aria-label="Play pronunciation"><SpeakerLoudIcon className="h-5 w-5" /></button>}
          </div>
          {promptJapanese && <p className="mt-2 font-mono text-sm font-black">{question.promptReading}</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isAnswer = option === question.correctAnswer;
            const feedbackClass = selectedAnswer && isAnswer ? 'bg-[#A3E636]' : selectedAnswer && isSelected ? 'bg-[#FF6B6B]' : 'bg-white hover:bg-neutral-100';
            return <button key={option} type="button" disabled={Boolean(selectedAnswer) || isMarkingAgain} onClick={() => handleAnswer(option)} className={`min-h-16 border-2 border-black p-3 text-left font-mono text-sm font-black shadow-[3px_3px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${feedbackClass}`}>{selectedAnswer && isAnswer && <CheckCircledIcon className="mr-2 inline h-4 w-4" />}{selectedAnswer && isSelected && !isAnswer && <ExclamationTriangleIcon className="mr-2 inline h-4 w-4" />}{option}</button>;
          })}
        </div>
        {selectedAnswer && !isCorrect && <p className="mt-4 border-2 border-black bg-[#FF6B6B] p-3 text-center font-mono text-xs font-black uppercase">Correct answer: {question.correctAnswer}</p>}
        {isMarkingAgain && <p className="mt-3 text-center font-mono text-[10px] font-black uppercase">Saving review marker...</p>}
        <button type="button" disabled={!selectedAnswer || isMarkingAgain} onClick={handleNext} className="mt-5 w-full border-2 border-black bg-black px-4 py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">{questionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question →'}</button>
      </section>
    </main>
  );
}
