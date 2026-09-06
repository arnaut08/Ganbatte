import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, ComponentType, FormEvent, KeyboardEvent, ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
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

type AssessmentCard = Partial<Pick<KanaCard & KanjiCard, 'kana' | 'romaji' | 'english'>> & {
  questionType?: 'multiple-choice' | 'type-in';
  promptKind?: 'kanji' | 'english';
  prompt?: string;
  promptReading?: string;
  options?: string[];
  correctAnswer?: string;
  answerType?: 'romaji' | 'text';
};

type AssessmentProps = {
  room?: AssessmentRoom | null;
  kanaCards?: AssessmentCard[];
  onSubmitAnswer?: (answer: string) => void;
  onUseHint?: (cardIndex: number) => void;
  onNextCard?: () => void;
  onForfeit?: () => void;
  username?: string;
};

type LegacyProps = {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
};

const LegacySwitch = Switch as unknown as ComponentType<LegacyProps>;
const LegacyLabel = Label as unknown as ComponentType<LegacyProps>;

export default function Assessment({
  room,
  kanaCards = [],
  onSubmitAnswer,
  onUseHint,
  onNextCard,
  onForfeit,
  username,
}: AssessmentProps) {
  const [answer, setAnswer] = useState('');
  const [showOpponentStatus, setShowOpponentStatus] = useState(true);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [showForfeitConfirmation, setShowForfeitConfirmation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submissionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardIndex = room?.currentCardIndex ?? 0;
  const currentCard: AssessmentCard = kanaCards[cardIndex] || {};
  const isLastCard = kanaCards.length > 0 && cardIndex === kanaCards.length - 1;

  // Domain Theme Resolution
  const isKanjiAssessment = room?.deckType === 'kanji';
  const isVocabAssessment = room?.deckType === 'vocab';
  const isGrammarAssessment = room?.deckType === 'grammar';
  const themeAccent = isKanjiAssessment ? '#70CFF8' : isVocabAssessment ? '#A3E636' : isGrammarAssessment ? '#C084FC' : '#FFDE59';
  const domainLabel = isKanjiAssessment ? '02 // KANJI DRILL' : isVocabAssessment ? '03 // VOCAB DRILL' : isGrammarAssessment ? '04 // GRAMMAR DRILL' : '01 // KANA READING';

  // Safe player lookups
  const currentPlayer = room?.players?.find((p) => p.name === username);
  const otherPlayer = room?.players?.find((p) => p.name !== username);

  // Real-time submission / ready states
  const submittedAnswer = currentPlayer?.answers?.[cardIndex];
  const submitted = submittedAnswer !== undefined && submittedAnswer !== null;

  const otherAnswer = otherPlayer?.answers?.[cardIndex];
  const otherSubmitted = otherAnswer !== undefined && otherAnswer !== null;
  const isExactTextAnswer = isVocabAssessment && currentCard.answerType === 'text';

  const answersMatch = (value: unknown) => isExactTextAnswer
    ? String(value || '').trim().toLowerCase() === String(currentCard.correctAnswer || '').trim().toLowerCase()
    : isKanjiAssessment || isVocabAssessment
      ? areRomajiAnswersEqual(value, currentCard?.romaji || '')
      : scoreRomajiAnswer(String(value), currentCard?.romaji || '').percentage === 100;

  // Hints calculation: max 2 overall, max 1 per card
  const totalHintsUsed = Array.isArray(currentPlayer?.hintsUsed)
    ? currentPlayer.hintsUsed.reduce((sum, value) => sum + Number(value || 0), 0)
    : 0;
  const currentHintsUsed = currentPlayer?.hintsUsed?.[cardIndex] ?? 0;
  const canUseHint = isKanjiAssessment && !submitted && currentHintsUsed === 0 && totalHintsUsed < 2;

  const currentReady = Boolean(currentPlayer?.ready);
  const otherReady = Boolean(otherPlayer?.ready);

  const otherCorrect =
    otherSubmitted &&
    (isExactTextAnswer
      ? String(otherAnswer || '').trim().toLowerCase() === String(currentCard.correctAnswer || '').trim().toLowerCase()
      : (isKanjiAssessment || isVocabAssessment)
      ? areRomajiAnswersEqual(otherAnswer, currentCard?.romaji || '')
      : scoreRomajiAnswer(String(otherAnswer), currentCard?.romaji || '').percentage === 100);

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

  useEffect(() => {
    if (submitted) {
      setIsSubmittingLocal(false);
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
    }
  }, [submitted]);

  useEffect(() => {
    return () => {
      if (submissionTimeoutRef.current) {
        clearTimeout(submissionTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (e?: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    if (e) e.preventDefault();
    const cleanAnswer = answer.trim().replace(/\s+/g, ' ').toLowerCase();

    if (!cleanAnswer || submitted || isSubmittingLocal) {
      return;
    }

    submitAnswer(cleanAnswer);
  };

  const submitAnswer = (value: string) => {
    if (!value || submitted || isSubmittingLocal) return;
    setAnswer(value);
    setIsSubmittingLocal(true);

    if (typeof onSubmitAnswer === 'function') {
      onSubmitAnswer(value);
    }

    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current);
    }
    submissionTimeoutRef.current = setTimeout(() => {
      setIsSubmittingLocal(false);
    }, 3500);
  };

  const progress = kanaCards.length > 0 ? ((cardIndex + 1) / kanaCards.length) * 100 : 0;
  const answerScore = scoreRomajiAnswer(submittedAnswer || '', currentCard?.romaji || '');
  const isCorrect = answersMatch(submittedAnswer || '');
  const answerDiff = !isCorrect && submitted && !isExactTextAnswer
    ? (isKanjiAssessment || isVocabAssessment
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
    <main className="container mx-auto max-w-3xl space-y-3.5 sm:space-y-5 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
      {/* 1. Header & Progress HUD */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <div className="min-w-0">
            <span
              className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider"
              style={{ color: themeAccent }}
            >
              {domainLabel}
            </span>
            <h1 className="truncate text-lg sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              {isKanjiAssessment ? 'Kanji Assessment' : isVocabAssessment ? 'Vocab Assessment' : isGrammarAssessment ? 'Grammar Assessment' : 'Reading Assessment'}
            </h1>
          </div>

          <div className="border-2 border-black bg-white px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] shrink-0">
            CARD {cardIndex + 1} / {kanaCards.length || 1}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full border-2 border-black bg-[#151922] shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress)}%`, backgroundColor: themeAccent }}
          />
        </div>
      </div>

      {/* 2. Main Arena Card */}
      <div
        className="relative border-2 border-black border-l-8 bg-[#1f2637] p-4 sm:p-6 shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] space-y-4"
        style={{ borderLeftColor: themeAccent }}
      >
        {/* Target Phrase Stage */}
        <div className="relative border-2 border-black bg-[#151922] p-4 sm:p-7 shadow-[3px_3px_0px_0px_#000]">
          {/* Stage Top Bar */}
          <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex shrink-0 flex-row items-center justify-end gap-2">
              <span
                className="shrink-0 border-2 border-black px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]"
                style={{ backgroundColor: themeAccent }}
              >
                TARGET PROMPT
              </span>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {username && (
                <span className="shrink-0 max-w-full truncate border-2 border-black bg-[#1f2637] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-300 shadow-[1px_1px_0px_0px_#000]">
                  OP: {username}
                </span>
              )}

              {/* Anchored Top-Right Hint Button */}
              {isKanjiAssessment && !submitted && (
                <div className="shrink-0">
                  {canUseHint ? (
                    <button
                      type="button"
                      onClick={() => onUseHint?.(cardIndex)}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 border-2 border-black bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#70CFF8] hover:shadow-[0.5px_0.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      title="Reveal English meaning hint"
                    >
                      <QuestionMarkCircledIcon className="h-3.5 w-3.5 text-black" />
                      <span>HINT ({2 - totalHintsUsed} LEFT)</span>
                    </button>
                  ) : currentHintsUsed > 0 ? (
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-[#70CFF8]">
                      HINT ACTIVE
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-500">
                      NO HINTS LEFT
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Target Japanese Text */}
          <div className="my-4 sm:my-6 text-center">
            <p className="jp-font text-3xl sm:text-5xl font-black text-white tracking-wide leading-relaxed">
              {isVocabAssessment ? currentCard?.prompt || '...' : currentCard?.kana || '...'}
            </p>
            {isVocabAssessment && currentCard.promptKind === 'kanji' && currentCard.promptReading && (
              <p className="mt-1 text-center font-mono text-xs font-bold text-neutral-400 sm:text-sm">
                {currentCard.promptReading}
              </p>
            )}
          </div>

          {/* Subtext Prompt or Active Hint Display */}
          <div className="flex flex-col items-center justify-center">
            {isKanjiAssessment && currentHintsUsed > 0 ? (
              <div className="border-2 border-black border-l-4 border-l-[#70CFF8] bg-[#1f2637] px-3 py-1 text-center font-mono shadow-[1.5px_1.5px_0px_0px_#000]">
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#70CFF8] mr-1.5">
                  HINT:
                </span>
                <span className="text-xs sm:text-sm font-black text-white">
                  {currentCard?.english}
                </span>
              </div>
            ) : (
              <span
                className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-center"
                style={{ color: themeAccent }}
              >
                {isVocabAssessment
                  ? currentCard.questionType === 'multiple-choice' ? 'SELECT THE CORRECT ANSWER' : currentCard.answerType === 'romaji' ? 'TYPE THE READING IN ROMAJI' : 'TYPE THE CORRECT ANSWER'
                  : isKanjiAssessment ? 'ENTER READING IN ROMAJI' : 'TRANSLITERATE TO ROMAJI'}
              </span>
            )}
          </div>
        </div>

        {/* 3. Input Form / Round Evaluation */}
        {!submitted ? (
          isVocabAssessment && currentCard.questionType === 'multiple-choice' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {(currentCard.options || []).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => submitAnswer(option)}
                  className="min-h-12 cursor-pointer border-2 border-black bg-[#151922] px-3 py-2 text-left font-mono text-xs font-black text-white shadow-[2px_2px_0px_0px_#000] transition-all hover:bg-[#A3E636] hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-sm"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
            <div className="flex flex-row gap-2 sm:gap-3">
              <div className="relative min-w-0 flex-1">
                <span className="absolute left-3 top-2.5 sm:top-3.5 font-mono text-sm sm:text-base font-black text-neutral-500 select-none">
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
                      : isVocabAssessment && currentCard.answerType === 'text'
                        ? 'Type the answer...'
                      : 'Type romaji reading...'
                  }
                  className="h-10 w-full min-w-0 flex-1 border-2 border-black bg-[#151922] pl-8 pr-3 font-mono text-xs font-black text-white shadow-[2px_2px_0px_0px_#000] placeholder:font-mono placeholder:text-xs placeholder:font-bold placeholder:text-neutral-500 focus:border-white focus:outline-none sm:h-13 sm:pl-9 sm:pr-4 sm:text-base sm:placeholder:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={!answer.trim() || isSubmittingLocal}
                style={{ backgroundColor: answer.trim() && !isSubmittingLocal ? themeAccent : undefined }}
                className={`h-10 min-w-[100px] shrink-0 border-2 border-black px-4 sm:h-13 sm:min-w-[130px] sm:px-6 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all whitespace-nowrap ${!answer.trim() || isSubmittingLocal
                    ? 'cursor-not-allowed bg-[#151922] text-neutral-500 opacity-60 shadow-none'
                    : 'cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  }`}
              >
                {isSubmittingLocal ? 'Submitting...' : 'Submit →'}
              </button>
            </div>
          </form>
          )
        ) : (
          /* Round Evaluation */
          <div className="space-y-3 sm:space-y-4 border-2 border-black bg-[#151922] p-3 sm:p-4 shadow-[2.5px_2.5px_0px_0px_#000]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-white/10 pb-2">
              <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-300">
                // ROUND EVALUATION
              </span>
              <span
                className={`border-2 border-black px-2 py-0.5 font-mono text-[10px] sm:text-xs font-black uppercase shadow-[1px_1px_0px_0px_#000] ${isCorrect ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
                  }`}
              >
                {isCorrect ? '✔ CORRECT' : '✖ INCORRECT'}
              </span>
            </div>

            <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
              {/* User Answer Card */}
              <div className="border-2 border-black bg-[#1f2637] p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000]">
                <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
                  YOUR INPUT
                </span>
                <p className="font-mono text-sm sm:text-base font-black text-white tracking-wide break-all">
                  {isCorrect || !answerDiff ? (
                    String(submittedAnswer ?? '')
                  ) : (
                    renderDifference(
                      answerDiff.given,
                      'text-[#FF6B6B] bg-[#FF6B6B]/20 px-0.5 rounded-xs underline decoration-[#FF6B6B] decoration-2'
                    )
                  )}
                </p>
              </div>

              {/* Target Answer Card (Fixed Theme Consistency & High-Contrast Diff) */}
              <div className="border-2 border-black bg-[#1f2637] p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000]">
                <span
                  className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider block mb-1"
                  style={{ color: themeAccent }}
                >
                  {isVocabAssessment && isExactTextAnswer ? 'CORRECT ANSWER' : 'CORRECT ROMAJI'}
                </span>
                <p className="font-mono text-sm sm:text-base font-black text-white tracking-wide break-all">
                  {isCorrect || !answerDiff ? (
                    isExactTextAnswer ? currentCard?.correctAnswer : currentCard?.romaji
                  ) : (
                    renderDifference(
                      answerDiff.expected,
                      'text-[#A3E636] bg-[#A3E636]/20 px-0.5 rounded-xs underline decoration-[#A3E636] decoration-2 font-black'
                    )
                  )}
                </p>
              </div>
            </div>

            {currentCard?.english && (
              <p className="font-mono text-[11px] sm:text-xs font-bold text-neutral-300">
                MEANING: <span className="text-white font-black">{currentCard.english}</span>
              </p>
            )}

            {/* Next Card Ready Trigger */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t-2 border-white/10 pt-2.5 sm:pt-3">
              {!currentReady ? (
                <button
                  type="button"
                  onClick={() => onNextCard?.()}
                  style={{ backgroundColor: themeAccent }}
                  className="cursor-pointer border-2 border-black px-4 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Ready for Next →
                </button>
              ) : (
                <div className="inline-flex items-center justify-center gap-2 border-2 border-black bg-white px-3 py-1.5 font-mono text-[11px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  <span className="h-2 w-2 animate-ping" style={{ backgroundColor: themeAccent }} />
                  <span>{isLastCard && !otherSubmitted ? 'Waiting for Opponent...' : 'Waiting for Next Card...'}</span>
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

        {/* 4. Bottom Controls */}
        <div className="flex flex-col items-start gap-4 border-t-2 border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
          {/* Left: HUD Toggle Switch */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LegacySwitch
              id="show-opponent"
              checked={showOpponentStatus}
              onCheckedChange={setShowOpponentStatus}
              style={showOpponentStatus ? { backgroundColor: themeAccent } : undefined}
              className="border-2 border-black"
            />
            <LegacyLabel
              htmlFor="show-opponent"
              className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400 cursor-pointer select-none"
            >
              HUD
            </LegacyLabel>
          </div>

          {/* Center: Opponent Status Box */}
          <div className="min-w-0 w-full flex justify-center sm:min-w-[240px]">
            {showOpponentStatus ? (
              <div className="flex min-w-0 max-w-full items-center gap-2 border-2 border-black bg-[#151922] px-2.5 py-1.5 shadow-[1.5px_1.5px_0px_0px_#000] sm:gap-3 sm:px-3.5 sm:py-2">
                <span className="min-w-0 truncate font-mono text-[10px] sm:text-xs font-black uppercase text-white">
                  VS {otherPlayer ? otherPlayer.name : 'OPPONENT'}:
                </span>
                <div>
                  {otherPlayer && otherSubmitted && otherCorrect && (
                    <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black">
                      ✔ Correct
                    </span>
                  )}
                  {otherPlayer && otherSubmitted && !otherCorrect && (
                    <span className="border-2 border-black bg-[#FF6B6B] px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black">
                      ✖ Wrong
                    </span>
                  )}
                  {otherPlayer && !otherSubmitted && (
                    <span className="border border-black bg-[#1f2637] px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-bold uppercase text-neutral-400">
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
            ) : null}
          </div>

          {/* Right: Forfeit Button */}
          {onForfeit && (
            <button
              type="button"
              onClick={() => setShowForfeitConfirmation(true)}
              className="cursor-pointer border-2 border-black bg-[#FF6B6B] px-4 py-2 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#ff5252] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all self-end sm:self-auto"
            >
              Forfeit Match →
            </button>
          )}
        </div>
      </div>

      {showForfeitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="dialog" aria-modal="true" aria-labelledby="forfeit-title">
          <div className="w-full max-w-sm border-2 border-black bg-[#1f2637] p-5 text-white shadow-[6px_6px_0px_0px_#000]">
            <h2 id="forfeit-title" className="font-mono text-lg font-black uppercase">Forfeit match?</h2>
            <p className="mt-2 font-mono text-xs text-neutral-300">This will count as a loss and award the win to your opponent.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForfeitConfirmation(false)} className="cursor-pointer border-2 border-black bg-white px-3 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">Cancel</button>
              <button type="button" onClick={() => { setShowForfeitConfirmation(false); onForfeit?.(); }} className="cursor-pointer border-2 border-black bg-[#FF6B6B] px-3 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">Forfeit Match</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}