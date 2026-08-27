import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, ComponentType, FormEvent, KeyboardEvent, ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  areRomajiAnswersEqual,
  buildDirectRomajiDiff,
  buildRomajiDiff,
  scoreRomajiAnswer,
} from '../../utils/romaji';
import type { DiffSegment, KanaCard, KanjiCard, Room } from '../../types';

type AssessmentRoom = {
  currentCardIndex?: number;
  deckType?: Room['deckType'];
  players?: Room['players'];
};

type AssessmentCard = Partial<Pick<KanaCard & KanjiCard, 'kana' | 'romaji' | 'english'>>;

type AssessmentProps = {
  room?: AssessmentRoom | null;
  kanaCards?: AssessmentCard[];
  onSubmitAnswer?: (answer: string) => void;
  onUseHint?: (cardIndex: number) => void;
  onNextCard?: () => void;
  username?: string;
};

type LegacyProps = {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
};

const LegacySwitch = Switch as unknown as ComponentType<LegacyProps>;
const LegacyLabel = Label as unknown as ComponentType<LegacyProps>;

function Assessment({
  room,
  kanaCards = [],
  onSubmitAnswer,
  onUseHint,
  onNextCard,
  username,
}: AssessmentProps) {
  const [answer, setAnswer] = useState('');
  const [showOpponentStatus, setShowOpponentStatus] = useState(true);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submissionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardIndex = room?.currentCardIndex ?? 0;
  const currentCard: AssessmentCard = kanaCards[cardIndex] || {};
  const isLastCard = kanaCards.length > 0 && cardIndex === kanaCards.length - 1;

  // Safe player lookups
  const currentPlayer = room?.players?.find((p) => p.name === username);
  const otherPlayer = room?.players?.find((p) => p.name !== username);

  // Hints calculation
  const totalHintsUsed = Array.isArray(currentPlayer?.hintsUsed)
    ? currentPlayer.hintsUsed.reduce((sum, value) => sum + Number(value || 0), 0)
    : 0;
  const currentHintsUsed = currentPlayer?.hintsUsed?.[cardIndex] ?? 0;

  // Real-time submission / ready states
  const submittedAnswer = currentPlayer?.answers?.[cardIndex];
  const submitted = submittedAnswer !== undefined && submittedAnswer !== null;

  const otherAnswer = otherPlayer?.answers?.[cardIndex];
  const otherSubmitted = otherAnswer !== undefined && otherAnswer !== null;

  const currentReady = Boolean(currentPlayer?.ready);
  const otherReady = Boolean(otherPlayer?.ready);
  const isKanjiAssessment = room?.deckType === 'kanji';

  const otherCorrect =
    otherSubmitted &&
    (isKanjiAssessment
      ? areRomajiAnswersEqual(otherAnswer, currentCard?.romaji || '')
      : scoreRomajiAnswer(String(otherAnswer), currentCard?.romaji || '').percentage === 100);

  // Clear timers and reset submission locks on new card
  useEffect(() => {
    setAnswer('');
    setIsSubmittingLocal(false);
    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [cardIndex]);

  // Unlock submission lock when room state updates with current answer
  useEffect(() => {
    if (submitted) {
      setIsSubmittingLocal(false);
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
    }
  }, [submitted]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
    };
  }, []);

  const canUseHint = isKanjiAssessment && !submitted && totalHintsUsed < 2;

  const handleSubmit = (e?: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    if (e) e.preventDefault();
    const cleanAnswer = answer.trim().toLowerCase();

    if (!cleanAnswer || submitted || isSubmittingLocal) {
      return;
    }

    setIsSubmittingLocal(true);

    if (typeof onSubmitAnswer === 'function') {
      onSubmitAnswer(cleanAnswer);
    }

    // Safety fallback: auto-unlock submit state if network or socket drops
    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
    }
    submissionTimeoutRef.current = setTimeout(() => {
      setIsSubmittingLocal(false);
    }, 3500);
  };

  // Evaluation Metrics
  const progress = kanaCards.length > 0 ? ((cardIndex + 1) / kanaCards.length) * 100 : 0;
  const answerScore = scoreRomajiAnswer(submittedAnswer || '', currentCard?.romaji || '');
  const isCorrect = isKanjiAssessment
    ? areRomajiAnswersEqual(submittedAnswer || '', currentCard?.romaji || '')
    : answerScore.percentage === 100;
  const answerDiff = !isCorrect && submitted
    ? (isKanjiAssessment
      ? buildDirectRomajiDiff(submittedAnswer || '', currentCard?.romaji || '')
      : buildRomajiDiff(submittedAnswer || '', currentCard?.romaji || ''))
    : null;

  const renderDifference = (segments: DiffSegment[] = [], tokenClass: string) =>
    segments.map((segment, index) => (
      <span
        key={`${segment.type}-${index}`}
        className={segment.type === 'diff' ? tokenClass : undefined}
      >
        {segment.text}
      </span>
    ));

  return (
    <main className="container mx-auto max-w-3xl space-y-3 sm:space-y-4 px-3 py-3 sm:px-4 sm:py-4 pb-20 sm:pb-24">
      {/* 1. Arena Header & Progress HUD */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFDE59]">
          // BATTLE ARENA: {isKanjiAssessment ? 'KANJI DRILL' : 'KANA READING'}
            </span>
            <h1 className="text-base sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
              {isKanjiAssessment ? 'Kanji Assessment' : 'Reading Assessment'}
            </h1>
          </div>

          <div className="border-2 border-black bg-white px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] shrink-0">
            CARD {cardIndex + 1} / {kanaCards.length || 1}
          </div>
        </div>

        {/* Neo-Brutalist Progress Bar */}
        <div className="h-2.5 sm:h-3.5 w-full border-2 border-black bg-[#1a1f2c] p-0.5 shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
          <div
            className="h-full bg-[#A3E636] transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
      </div>

      {/* 2. Main Arena Battle Container */}
      <div className="relative border-2 border-black bg-[#1a1f2c] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000] space-y-3.5 sm:space-y-5">

        {/* Target Phrase Hero Card */}
        <div className="relative border-2 border-black bg-[#FFDE59] p-3.5 sm:p-8 shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
          <div className="flex items-center justify-between gap-2">
            <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#FFDE59]">
              TARGET PHRASE
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-bold text-black/70 truncate">
              OPERATOR: {username}
            </span>
          </div>

          {/* Target Japanese Text */}
          <div className="my-3 sm:my-6 text-center">
            <p className="jp-font text-xl sm:text-4xl font-black text-black tracking-wide leading-relaxed">
              {currentCard?.kana || '...'}
            </p>
          </div>

          {/* Subtext Prompt & Hint */}
          <div className="flex flex-col items-center gap-1 text-center font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black/70">
            {isKanjiAssessment ? (
              currentHintsUsed > 0 ? (
                <span className="border border-black bg-white px-2 py-0.5 text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  HINT: {currentCard?.english}
                </span>
              ) : (
                <span>ENTER READING IN ROMAJI</span>
              )
            ) : (
              <span>TRANSLITERATE TO ROMAJI</span>
            )}
          </div>
        </div>

        {/* 3. Input Form / Post-Submission Review */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 sm:top-3.5 font-mono text-sm sm:text-base font-black text-neutral-400 select-none">
                  &gt;
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  value={answer}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setAnswer(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      handleSubmit(e);
                    }
                  }}
                  placeholder={
                    isKanjiAssessment
                      ? 'Type reading in romaji...'
                      : 'Type romaji reading...'
                  }
                  className="h-10 sm:h-13 w-full border-2 border-black bg-white pl-7 pr-3 sm:pl-8 sm:pr-4 font-mono text-xs sm:text-base font-black text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] placeholder:font-sans placeholder:text-xs sm:placeholder:text-sm placeholder:font-bold placeholder:text-neutral-400 focus-visible:bg-[#f3f9ff] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {canUseHint && (
                  <button
                    type="button"
                    onClick={() => onUseHint?.(cardIndex)}
                    className="h-10 sm:h-13 flex-1 sm:flex-none border-2 border-black bg-[#FFDE59] px-3 sm:px-4 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] hover:bg-[#ffe57e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none whitespace-nowrap"
                  >
                    Hint ({2 - totalHintsUsed})
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!answer.trim() || isSubmittingLocal}
                  className="h-10 sm:h-13 flex-1 sm:flex-none sm:min-w-[120px] border-2 border-black bg-[#A3E636] px-4 sm:px-6 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSubmittingLocal ? 'Submitting...' : 'Submit →'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Round Evaluation */
          <div className="space-y-3 sm:space-y-4 border-2 border-black bg-[#252c3d] p-3 sm:p-4 shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
            <div className="flex items-center justify-between border-b-2 border-black/40 pb-2">
              <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">
            // ROUND EVALUATION
              </span>
              <span
                className={`border-2 border-black px-2 py-0.5 font-mono text-[10px] sm:text-xs font-black uppercase ${isCorrect
                    ? 'bg-[#A3E636] text-black'
                    : 'bg-[#FF6B6B] text-black'
                  }`}
              >
                {isCorrect ? '✔ CORRECT' : '✖ INCORRECT'}
              </span>
            </div>

            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
              {/* User Answer */}
              <div className="border-2 border-black bg-[#1a1f2c] p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase text-neutral-400">
                  YOUR INPUT
                </span>
                <p className="mt-0.5 sm:mt-1 font-mono text-sm sm:text-base font-black text-white">
                  {isCorrect || !answerDiff ? (
                    String(submittedAnswer ?? '')
                  ) : (
                    renderDifference(
                      answerDiff.given,
                      'text-[#FF6B6B] font-black'
                    )
                  )}
                </p>
              </div>

              {/* Correct Target Answer */}
              <div className="border-2 border-black bg-[#A3E636] p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase text-black/70">
                  CORRECT ROMAJI
                </span>
                <p className="mt-0.5 sm:mt-1 font-mono text-sm sm:text-base font-black text-black">
                  {isCorrect || !answerDiff ? (
                    currentCard?.romaji
                  ) : (
                    renderDifference(answerDiff.expected, 'font-black underline')
                  )}
                </p>
              </div>
            </div>

            {currentCard?.english && (
              <p className="font-mono text-[11px] sm:text-xs font-bold text-neutral-300">
                MEANING:{' '}
                <span className="text-white font-black">
                  {currentCard.english}
                </span>
              </p>
            )}

            {/* Next Card Ready Trigger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t-2 border-black/40 pt-2.5 sm:pt-3">
              {!currentReady ? (
                <button
                  type="button"
                  onClick={() => onNextCard?.()}
                  className="border-2 border-black bg-[#A3E636] px-4 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Ready for Next →
                </button>
              ) : (
                <div className="inline-flex items-center justify-center gap-2 border-2 border-black bg-[#FFDE59] px-3 py-1.5 font-mono text-[11px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                  <span className="h-2 w-2 animate-ping bg-black" />
                  <span>{isLastCard && !otherSubmitted ? 'Waiting for Other Player...' : 'Waiting for Next Card...'}</span>
                </div>
              )}

              <span className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400 text-center sm:text-right">
                {otherReady
                  ? '● Other player ready'
                  : otherSubmitted
                    ? '● Other player submitted'
                    : '○ Other player formulating...'}
              </span>
            </div>
          </div>
        )}

        {/* 4. Opponent Status HUD Bar */}
        <div className="flex items-center justify-between gap-2 border-t-2 border-neutral-700/60 pt-3 sm:pt-4">
          {showOpponentStatus ? (
            <div className="flex items-center gap-2 sm:gap-3 border-2 border-black bg-[#252c3d] px-2.5 py-1.5 sm:px-3.5 sm:py-2 shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
              <span className="font-mono text-[10px] sm:text-xs font-black uppercase text-white truncate">
                VS {otherPlayer ? otherPlayer.name : 'OPPONENT'}:
              </span>
              <div>
                {otherPlayer && otherSubmitted && otherCorrect && (
                  <span className="border border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black">
                    ✔ Correct
                  </span>
                )}
                {otherPlayer && otherSubmitted && !otherCorrect && (
                  <span className="border border-black bg-[#FF6B6B] px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black">
                    ✖ Wrong
                  </span>
                )}
                {otherPlayer && !otherSubmitted && (
                  <span className="border border-black bg-neutral-700 px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase text-neutral-300">
                    Typing...
                  </span>
                )}
                {!otherPlayer && (
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
                    Waiting...
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Toggle Switch */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LegacySwitch
              id="show-opponent"
              checked={showOpponentStatus}
              onCheckedChange={setShowOpponentStatus}
            />
            <LegacyLabel
              htmlFor="show-opponent"
              className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 cursor-pointer select-none"
            >
              Opponent HUD
            </LegacyLabel>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Assessment;