import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircledIcon, CrossCircledIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';
import { markVocabAgain, saveStageQuizResult, type SaveStageQuizPayload } from '../../../services/api';
import type { VocabStudyItem } from '../../../types';
import { generateVocabQuiz, type VocabQuizQuestion } from '../../../utils/quizGenerator';
import useActivityRecorder from '../../../hooks/useActivityRecorder';

function renderFurigana(text: string): ReactNode {
  const source = String(text || '');
  if (!source) return null;

  const pattern = /([\p{Script=Han}]+)\[([^\]]+)\]/gu;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match = pattern.exec(source);

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    const kanji = match[1];
    const reading = match[2];

    nodes.push(
      <ruby key={`${match.index}-${kanji}`} className="align-baseline">
        <span>{kanji}</span>
        <rt className="font-mono text-xs font-black tracking-normal text-[#A3E636] select-none">
          {reading}
        </rt>
      </ruby>
    );

    lastIndex = match.index + match[0].length;
    match = pattern.exec(source);
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

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
    return Array.isArray(parsed) ? (parsed as SaveStageQuizPayload[]) : [];
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
    const handleOnline = () => {
      void retryPendingResults();
    };
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
    if (question?.type === 'japanese-to-english' && question.vocab.kana) {
      speak(question.vocab.kana);
    }
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
      const payload = { level, stageNumber, score: finalScore, totalQuestions: questions.length, passed: finalPassed };
      setElapsedSeconds(finalElapsedSeconds);
      cacheResult(payload);
      void syncResult(payload);
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
      <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        <section className="border-2 border-black border-l-8 border-l-[#FF6B6B] bg-[#1f2637] p-6 text-white shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000]">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#FF6B6B] sm:text-xs">
            // ERROR
          </span>
          <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Quiz Unavailable
          </h1>
          <p className="mt-2 font-mono text-xs font-bold uppercase text-neutral-300 sm:text-sm">
            This stage does not contain enough vocabulary.
          </p>
          <button
            type="button"
            onClick={onBackToStageMap}
            className="mt-6 cursor-pointer border-2 border-black bg-white px-5 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#A3E636] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
          >
            Return to Stage Map
          </button>
        </section>
      </main>
    );
  }

  // --- RESULTS SCREEN ---
  if (isComplete) {
    const passed = score / questions.length >= 0.8;
    const isMastered = passed && items.length > 0 && items.every((item) => (item.progress?.srs_stage || 0) >= 4);

    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 pb-20 sm:space-y-6 sm:px-4 sm:py-6 sm:pb-28">
        {/* Main Result Summary Card */}
        <section
          className={`border-2 border-black border-l-8 bg-[#1f2637] p-5 text-white shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000] ${passed ? 'border-l-[#A3E636]' : 'border-l-[#FF6B6B]'
            }`}
        >
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#A3E636] sm:text-xs">
            STAGE {stageNumber} // QUIZ COMPLETE
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
                ? '★ STAGE MASTERED! CROWN BADGE UNLOCKED'
                : '✓ STAGE CLEARED! SILVER BADGE UNLOCKED'
              : 'TRY AGAIN (80% REQUIRED TO CLEAR STAGE)'}
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
              <strong className="mt-1 block font-mono text-xl font-black text-[#A3E636] sm:text-3xl">
                {formatElapsed(elapsedSeconds)}
              </strong>
            </div>
          </div>
        </section>

        {/* Missed Words Section */}
        {missedQuestions.length > 0 && (
          <section className="border-2 border-black border-l-8 border-l-[#FF6B6B] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] sm:p-6 sm:shadow-[5px_5px_0px_0px_#000]">
            <h2 className="font-mono text-[10px] font-black uppercase tracking-wider text-[#FF6B6B] sm:text-xs">
              MISSED WORDS // REVIEW AGAIN
            </h2>
            <div className="mt-3 space-y-2 sm:space-y-2.5">
              {missedQuestions.map((missed) => (
                <div
                  key={missed.id}
                  className="border-2 border-black bg-[#151922] p-3 shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-1.5">
                    <span className="jp-font text-lg font-black text-white sm:text-xl">
                      {renderFurigana(missed.vocab.furigana || missed.vocab.kanji)}
                    </span>
                    <span className="font-mono text-xs font-black text-[#A3E636]">
                      {missed.vocab.kana}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-xs font-bold text-neutral-300">
                    {missed.vocab.english.join(' / ')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="cursor-pointer border-2 border-black bg-[#A3E636] px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
          >
            Retry Quiz ↺
          </button>
          <button
            type="button"
            onClick={onBackToStageMap}
            className="cursor-pointer border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-neutral-100 hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
          >
            Return to Stage Map →
          </button>
        </div>
      </main>
    );
  }

  // --- ACTIVE QUIZ QUESTION SCREEN ---
  const isCorrect = selectedAnswer === question.correctAnswer;
  const promptJapanese = question.type === 'japanese-to-english';

  return (
    <main className="mx-auto w-full max-w-3xl space-y-3.5 px-3 py-4 sm:space-y-5 sm:px-4 sm:py-6 sm:pb-28">
      {/* Header */}
      <header className="flex items-center justify-between gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBackToStageMap}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
          title="Return to vocabulary stage map"
          aria-label="Return to vocabulary stage map"
        >
          <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
        </button>
        <div className="text-right">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#A3E636] sm:text-xs">
            STAGE {stageNumber} // PRACTICE QUIZ
          </span>
          <h1 className="text-lg font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
            Vocabulary Check
          </h1>
        </div>
      </header>

      {/* Main Question Card */}
      <section className="border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]">
        {/* Question Tracker & Elapsed Time */}
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 font-mono text-[10px] font-black uppercase text-neutral-300 sm:text-xs">
          <span>
            QUESTION {questionIndex + 1} OF {questions.length}
          </span>
          <span className="text-[#A3E636]">{formatElapsed(elapsedSeconds)}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-3.5 overflow-hidden border-2 border-black bg-[#151922] shadow-[1px_1px_0px_0px_#000] sm:h-4">
          <div
            className="h-full bg-[#A3E636] transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Vocabulary Prompt Display Stage */}
        <div className="relative my-4 flex flex-col items-center justify-center border-2 border-black bg-[#151922] px-4 py-8 text-center shadow-[3px_3px_0px_0px_#000] sm:my-5 sm:py-10">
          {/* Speaker button cleanly anchored in the top-right corner */}
          {promptJapanese && (
            <button
              type="button"
              onClick={() => speak(question.vocab.kana)}
              className="absolute right-2.5 top-2.5 flex cursor-pointer items-center gap-1 border-2 border-black bg-white px-2 py-1 font-mono text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#A3E636] hover:shadow-[0.5px_0.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:right-3.5 sm:top-3.5 sm:text-[10px]"
              aria-label="Play pronunciation"
              title="Play pronunciation"
            >
              <SpeakerLoudIcon className="h-3.5 w-3.5 text-black" />
              <span>AUDIO</span>
            </button>
          )}

          <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#A3E636] sm:text-[10px]">
            {promptJapanese ? 'SELECT THE ENGLISH MEANING' : 'SELECT THE JAPANESE WORD'}
          </span>

          <h2
            className={`mt-4 font-black leading-tight text-white ${promptJapanese ? 'jp-font text-5xl sm:text-7xl' : 'text-2xl sm:text-4xl'
              }`}
          >
            {promptJapanese
              ? renderFurigana(question.vocab.furigana || question.prompt)
              : question.prompt}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isAnswer = option === question.correctAnswer;

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
                disabled={Boolean(selectedAnswer) || isMarkingAgain}
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

        {/* Error Feedback */}
        {selectedAnswer && !isCorrect && (
          <div className="mt-3.5 border-2 border-black bg-[#FF6B6B] p-2.5 text-center font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:p-3">
            CORRECT ANSWER: {question.correctAnswer}
          </div>
        )}

        {isMarkingAgain && (
          <p className="mt-2 text-center font-mono text-[10px] font-black uppercase text-neutral-400">
            Saving review marker...
          </p>
        )}

        {/* Next / Finish Button */}
        <button
          type="button"
          disabled={!selectedAnswer || isMarkingAgain}
          onClick={handleNext}
          className={`mt-4 w-full border-2 border-black py-2.5 font-mono text-xs font-black uppercase tracking-wider transition-all sm:mt-5 sm:py-3 sm:text-sm ${selectedAnswer && !isMarkingAgain
              ? 'cursor-pointer bg-white text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#A3E636] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
              : 'cursor-not-allowed bg-[#151922] text-neutral-600 opacity-50 shadow-none'
            }`}
        >
          {questionIndex === questions.length - 1 ? 'Finish Quiz →' : 'Next Question →'}
        </button>
      </section>
    </main>
  );
}