import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { buildRomajiDiff, scoreRomajiAnswer } from '../utils/romaji';

function Assessment({
  room,
  kanaCards = [],
  onSubmitAnswer,
  onUseHint,
  onNextCard,
  username,
}) {
  const [answer, setAnswer] = useState('');
  const [showOpponentStatus, setShowOpponentStatus] = useState(true);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const inputRef = useRef(null);
  const submissionTimeoutRef = useRef(null);

  const cardIndex = room?.currentCardIndex ?? 0;
  const currentCard = kanaCards[cardIndex] || {};

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

  const otherCorrect =
    otherSubmitted &&
    scoreRomajiAnswer(String(otherAnswer), currentCard?.romaji || '').percentage === 100;

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

  const isKanjiAssessment = room?.deckType === 'kanji';
  const canUseHint = isKanjiAssessment && !submitted && totalHintsUsed < 2;

  const handleSubmit = (e) => {
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
  const isCorrect = answerScore.percentage === 100;
  const answerDiff = !isCorrect && submitted
    ? buildRomajiDiff(submittedAnswer || '', currentCard?.romaji || '')
    : null;

  const renderDifference = (segments = [], tokenClass) =>
    segments.map((segment, index) => (
      <span
        key={`${segment.type}-${index}`}
        className={segment.type === 'diff' ? tokenClass : undefined}
      >
        {segment.text}
      </span>
    ));

  return (
    <main className="container mx-auto max-w-3xl space-y-4 px-4 py-4">
      {/* 1. Arena Header & Progress HUD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-[#FFDE59]">
              // BATTLE ARENA: {isKanjiAssessment ? 'KANJI DRILL' : 'KANA READING'}
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl leading-tight">
              {isKanjiAssessment ? 'Kanji Assessment' : 'Reading Assessment'}
            </h1>
          </div>

          <div className="border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black text-black shadow-[3px_3px_0px_0px_#000000]">
            CARD {cardIndex + 1} / {kanaCards.length || 1}
          </div>
        </div>

        {/* Neo-Brutalist Progress Bar */}
        <div className="h-3.5 w-full border-2 border-black bg-[#1a1f2c] p-0.5 shadow-[2px_2px_0px_0px_#000000]">
          <div
            className="h-full bg-[#A3E636] transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>
      </div>

      {/* 2. Main Arena Battle Container */}
      <div className="relative border-2 border-black bg-[#1a1f2c] p-5 shadow-[6px_6px_0px_0px_#000000] space-y-5 sm:p-6">
        
        {/* Target Phrase Hero Card */}
        <div className="relative border-2 border-black bg-[#FFDE59] p-6 shadow-[4px_4px_0px_0px_#000000] sm:p-8">
          <div className="flex items-center justify-between">
            <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FFDE59]">
              TARGET PHRASE
            </span>
            <span className="font-mono text-xs font-bold text-black/70">
              OPERATOR: {username}
            </span>
          </div>

          {/* Target Japanese Text */}
          <div className="my-6 text-center">
            <p className="jp-font text-2xl font-black text-black sm:text-4xl tracking-wide leading-relaxed">
              {currentCard?.kana || '...'}
            </p>
          </div>

          {/* Subtext Prompt & Hint */}
          <div className="flex flex-col items-center gap-1 text-center font-mono text-xs font-black uppercase tracking-wider text-black/70">
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
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-3.5 font-mono text-base font-black text-neutral-400 select-none">
                  &gt;
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmit(e);
                    }
                  }}
                  placeholder={
                    isKanjiAssessment
                      ? 'Type reading in romaji...'
                      : 'Type romaji reading...'
                  }
                  className="h-13 w-full border-2 border-black bg-white pl-8 pr-4 font-mono text-base font-black text-black shadow-[4px_4px_0px_0px_#000000] placeholder:font-sans placeholder:text-sm placeholder:font-bold placeholder:text-neutral-400 focus-visible:bg-[#f3f9ff] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                {canUseHint && (
                  <button
                    type="button"
                    onClick={() => onUseHint?.(cardIndex)}
                    className="h-13 border-2 border-black bg-[#FFDE59] px-4 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] hover:bg-[#ffe57e] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    Hint ({2 - totalHintsUsed})
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!answer.trim() || isSubmittingLocal}
                  className="h-13 min-w-[120px] border-2 border-black bg-[#A3E636] px-6 font-mono text-sm font-black uppercase tracking-wider text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSubmittingLocal ? 'Submitting...' : 'Submit →'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Round Evaluation */
          <div className="space-y-4 border-2 border-black bg-[#252c3d] p-4 shadow-[4px_4px_0px_0px_#000000]">
            <div className="flex items-center justify-between border-b-2 border-black/40 pb-2">
              <span className="font-mono text-xs font-black uppercase tracking-wider text-white">
                // ROUND EVALUATION
              </span>
              <span
                className={`border-2 border-black px-2.5 py-0.5 font-mono text-xs font-black uppercase ${
                  isCorrect
                    ? 'bg-[#A3E636] text-black'
                    : 'bg-[#FF6B6B] text-black'
                }`}
              >
                {isCorrect ? '✔ CORRECT' : '✖ INCORRECT'}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* User Answer */}
              <div className="border-2 border-black bg-[#1a1f2c] p-3 shadow-[2px_2px_0px_0px_#000000]">
                <span className="font-mono text-[10px] font-black uppercase text-neutral-400">
                  YOUR INPUT
                </span>
                <p className="mt-1 font-mono text-base font-black text-white">
                  {isCorrect || !answerDiff ? (
                    submittedAnswer
                  ) : (
                    renderDifference(
                      answerDiff.given,
                      'text-[#FF6B6B] font-black'
                    )
                  )}
                </p>
              </div>

              {/* Correct Target Answer */}
              <div className="border-2 border-black bg-[#A3E636] p-3 shadow-[2px_2px_0px_0px_#000000]">
                <span className="font-mono text-[10px] font-black uppercase text-black/70">
                  CORRECT ROMAJI
                </span>
                <p className="mt-1 font-mono text-base font-black text-black">
                  {isCorrect || !answerDiff ? (
                    currentCard?.romaji
                  ) : (
                    renderDifference(answerDiff.expected, 'font-black underline')
                  )}
                </p>
              </div>
            </div>

            {currentCard?.english && (
              <p className="font-mono text-xs font-bold text-neutral-300">
                MEANING:{' '}
                <span className="text-white font-black">
                  {currentCard.english}
                </span>
              </p>
            )}

            {/* Next Card Ready Trigger */}
            <div className="flex items-center justify-between border-t-2 border-black/40 pt-3">
              {!currentReady ? (
                <button
                  type="button"
                  onClick={() => onNextCard?.()}
                  className="border-2 border-black bg-[#A3E636] px-5 py-2 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  Ready for Next →
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 border-2 border-black bg-[#FFDE59] px-3.5 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
                  <span className="h-2 w-2 animate-ping bg-black" />
                  <span>Waiting for Next Card...</span>
                </div>
              )}

              <span className="font-mono text-xs font-bold text-neutral-400">
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
        <div className="flex items-center justify-between border-t-2 border-neutral-700/60 pt-4">
          {showOpponentStatus ? (
            <div className="flex items-center gap-3 border-2 border-black bg-[#252c3d] px-3.5 py-2 shadow-[2px_2px_0px_0px_#000000]">
              <span className="font-mono text-xs font-black uppercase text-white">
                VS {otherPlayer ? otherPlayer.name : 'OPPONENT'}:
              </span>
              <div>
                {otherPlayer && otherSubmitted && otherCorrect && (
                  <span className="border border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black">
                    ✔ Correct
                  </span>
                )}
                {otherPlayer && otherSubmitted && !otherCorrect && (
                  <span className="border border-black bg-[#FF6B6B] px-2 py-0.5 font-mono text-[10px] font-black uppercase text-black">
                    ✖ Wrong
                  </span>
                )}
                {otherPlayer && !otherSubmitted && (
                  <span className="border border-black bg-neutral-700 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-neutral-300">
                    Typing...
                  </span>
                )}
                {!otherPlayer && (
                  <span className="font-mono text-xs font-bold text-neutral-400">
                    Waiting...
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Toggle Switch */}
          <div className="flex items-center gap-2">
            <Switch
              id="show-opponent"
              checked={showOpponentStatus}
              onCheckedChange={setShowOpponentStatus}
            />
            <Label
              htmlFor="show-opponent"
              className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400 cursor-pointer select-none"
            >
              Opponent HUD
            </Label>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Assessment;