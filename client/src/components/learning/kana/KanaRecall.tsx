import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  getCharacterAttempts,
  getKanaCards,
  recordCharacterAttempt,
} from '../../../services/api';
import { buildKanaAttempt } from '../../../utils/kanaRecall';
import useActivityRecorder from '../../../hooks/useActivityRecorder';
import { useCelebrations } from '../../../contexts/CelebrationContext';
import type { KanaCard } from '../../../types';
import KanaRecallSkeleton from './KanaRecallSkeleton';
import GlobalPageHeader from '@/components/common/GlobalPageHeader';

type KanaRecallCard = KanaCard & { id: string };

type KanaMastery = {
  correct_streak: number;
  total_attempts: number;
};

type LocalAttempt = {
  correct: boolean;
};

type KanaRecallProps = {
  onBack: () => void;
  onOpenFilter: () => void;
  selectedKana?: Set<string>;
};

const MASTERY_TARGET = 3;

type MasteryState = 'unlearned' | 'practicing' | 'mastered';

function getMasteryState(streak: number): MasteryState {
  if (streak >= MASTERY_TARGET) return 'mastered';
  if (streak >= 1) return 'practicing';
  return 'unlearned';
}

const MASTERY_STATE_BADGE: Record<MasteryState, { label: string; chipClass: string }> = {
  unlearned: { label: 'UNLEARNED', chipClass: 'bg-[#252c3d] text-neutral-300' },
  practicing: { label: 'PRACTICING', chipClass: 'bg-[#70CFF8] text-black' },
  mastered: { label: '★ MASTERED', chipClass: 'bg-[#A3E636] text-black' },
};

const NEXT_BUTTON_CLASSES =
  'cursor-pointer border-2 border-black bg-white px-5 py-2 sm:px-6 sm:py-2.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#FFDE59] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';

function KanaRecall({ onBack, onOpenFilter, selectedKana }: KanaRecallProps) {
  const [cards, setCards] = useState<KanaRecallCard[]>([]);
  const [masteryById, setMasteryById] = useState<Record<string, KanaMastery>>({});
  const [sessionSummary, setSessionSummary] = useState<{ mastered: number; practicing: number; unlearned: number } | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attempt, setAttempt] = useState<LocalAttempt | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { recordActivity } = useActivityRecorder();
  const { hasActiveCelebration } = useCelebrations();
  const hasRecordedActivity = useRef(false);

  useEffect(() => {
    Promise.all([getKanaCards(), getCharacterAttempts('kana')])
      .then(([cardsData, attemptsData]) => {
        setCards(Array.isArray(cardsData?.cards) ? (cardsData.cards as KanaRecallCard[]) : []);
        const mastery: Record<string, KanaMastery> = {};
        ((attemptsData?.attempts as unknown[]) || []).forEach((item) => {
          const savedItem = item as { character_id?: string; character?: string; correct_streak?: number; total_attempts?: number };
          const key = savedItem.character_id || savedItem.character;
          if (!key) return;
          mastery[key] = {
            correct_streak: Number(savedItem.correct_streak ?? 0),
            total_attempts: Number(savedItem.total_attempts ?? 0),
          };
        });
        setMasteryById(mastery);
      })
      .catch(() => setError('Unable to load Kana recall. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const activeCards = useMemo(() => {
    const selected = selectedKana && selectedKana.size > 0;
    return selected ? cards.filter((c) => selectedKana.has(c.kana)) : cards;
  }, [cards, selectedKana]);

  const card = activeCards[cardIndex];

  useEffect(() => {
    setCardIndex((current) => Math.min(current, Math.max(activeCards.length - 1, 0)));
  }, [activeCards.length]);

  const resetCard = () => {
    setAnswer('');
    setAttempt(null);
    setSaveError('');
  };

  useEffect(() => {
    if (!card) return;
    resetCard();
  }, [card]);

  useEffect(() => {
    if (card && !attempt && !isComplete) {
      inputRef.current?.focus();
    }
  }, [card?.id, attempt, isComplete]);

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!card || attempt || !answer.trim()) return;
    const nextAttempt = buildKanaAttempt({ card, answer, usedHint: false });
    setAttempt({ correct: nextAttempt.correct });
    setSaveError('');

    const previous = masteryById[card.id] ?? { correct_streak: 0, total_attempts: 0 };
    const optimistic = {
      correct_streak: nextAttempt.correct ? previous.correct_streak + 1 : 0,
      total_attempts: previous.total_attempts + 1,
    };
    setMasteryById((current) => ({ ...current, [card.id]: optimistic }));

    if (nextAttempt.correct && !hasRecordedActivity.current) {
      hasRecordedActivity.current = true;
      void recordActivity();
    }

    try {
      const result = await recordCharacterAttempt(nextAttempt);
      const savedAttempt = result?.attempt as { character_id?: string; correct_streak?: number; total_attempts?: number } | undefined;
      if (savedAttempt?.character_id && savedAttempt.character_id !== card.id) {
        setSaveError('Kana character identity did not match the selected card.');
      }
      if (savedAttempt?.correct_streak != null || savedAttempt?.total_attempts != null) {
        setMasteryById((current) => ({
          ...current,
          [card.id]: {
            correct_streak: Number(savedAttempt.correct_streak ?? optimistic.correct_streak),
            total_attempts: Number(savedAttempt.total_attempts ?? optimistic.total_attempts),
          },
        }));
      }
    } catch {
      setSaveError('Progress saved for this session, but could not sync to your profile.');
    }
  };

  const buildSessionSummary = () => {
    const stateCounts = { mastered: 0, practicing: 0, unlearned: 0 };
    activeCards.forEach((activeCard) => {
      const state = getMasteryState(Number(masteryById[activeCard.id]?.correct_streak ?? 0));
      stateCounts[state] += 1;
    });
    setSessionSummary(stateCounts);
  };

  const finishSession = () => {
    setIsComplete(true);
    buildSessionSummary();
  };

  const moveNext = () => {
    if (!card) return;
    if (cardIndex === activeCards.length - 1) {
      finishSession();
      return;
    }
    setCardIndex((current) => current + 1);
    resetCard();
  };

  const handleScreenBack = () => {
    if (isComplete) {
      onOpenFilter();
    } else {
      onBack();
    }
  };

  // Global enter listener
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Enter') return;
      if (hasActiveCelebration) return;
      if (isComplete) {
        onOpenFilter();
        return;
      }
      if (attempt) {
        event.preventDefault();
        moveNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [attempt, isComplete, cardIndex, activeCards.length, hasActiveCelebration]);

  const streak = card ? Number(masteryById[card.id]?.correct_streak ?? 0) : 0;
  const totalAttempts = card ? Number(masteryById[card.id]?.total_attempts ?? 0) : 0;
  const masteryState = getMasteryState(streak);
  const masteryBadge = MASTERY_STATE_BADGE[masteryState];

  return (
    <main className="mx-auto w-full max-w-3xl space-y-3 px-3 py-4 pb-20 sm:space-y-5 sm:px-4 sm:py-6 sm:pb-28">
      <GlobalPageHeader
        onBack={handleScreenBack}
        punchline="// ACTIVE RECALL: KANA"
        title="Read the character"
        accentClass="text-[#FFDE59]"
        rightSlot={(
          <button
            type="button"
            onClick={onOpenFilter}
            className="cursor-pointer border-2 border-black bg-[#151922] border-l-4 border-l-[#A3E636] px-2.5 py-1 font-mono text-[10px] font-black uppercase text-white shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#252c3d] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-3.5 sm:py-1.5 sm:text-xs sm:shadow-[3px_3px_0px_0px_#000000]"
          >
            <strong className="text-[#A3E636]">{activeCards.length}</strong> CARDS
          </button>
        )}
      />

      {isLoading && <KanaRecallSkeleton />}

      {error && (
        <div className="border-2 border-black bg-[#FF6B6B] p-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000] sm:p-4 sm:text-sm">
          {error}
        </div>
      )}

      {/* Session Complete View */}
      {!isLoading && !error && isComplete && sessionSummary && (
        <section className="border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000000]">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#FFDE59] sm:text-xs">
            // SESSION COMPLETE
          </span>
          <h2 className="mt-0.5 text-2xl font-black uppercase tracking-tight text-white sm:mt-1 sm:text-4xl">
            Nice work!
          </h2>
          <p className="mt-1 font-mono text-xs font-medium leading-tight text-neutral-300 sm:text-sm">
            Every correct answer grows a character&apos;s streak — 3 in a row locks in ★ MASTERED.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <div className="border-2 border-black bg-[#151922] border-t-4 border-t-[#A3E636] p-2.5 text-center shadow-[2px_2px_0px_0px_#000] sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
              <span className="block font-mono text-xl font-black text-[#A3E636] sm:text-3xl">{sessionSummary.mastered}</span>
              <span className="font-mono text-[9px] font-black uppercase text-neutral-300 sm:text-xs">Mastered</span>
            </div>
            <div className="border-2 border-black bg-[#151922] border-t-4 border-t-[#70CFF8] p-2.5 text-center shadow-[2px_2px_0px_0px_#000] sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
              <span className="block font-mono text-xl font-black text-[#70CFF8] sm:text-3xl">{sessionSummary.practicing}</span>
              <span className="font-mono text-[9px] font-black uppercase text-neutral-300 sm:text-xs">Practicing</span>
            </div>
            <div className="border-2 border-black bg-[#151922] border-t-4 border-t-neutral-500 p-2.5 text-center shadow-[2px_2px_0px_0px_#000] sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
              <span className="block font-mono text-xl font-black text-white sm:text-3xl">{sessionSummary.unlearned}</span>
              <span className="font-mono text-[9px] font-black uppercase text-neutral-300 sm:text-xs">Unlearned</span>
            </div>
          </div>

          <div className="mt-5 flex justify-end border-t-2 border-white/10 pt-3.5 sm:mt-6 sm:pt-4">
            <button type="button" onClick={onOpenFilter} className={NEXT_BUTTON_CLASSES}>
              DONE →
            </button>
          </div>
          {saveError && <p className="mt-2 font-mono text-[10px] font-bold text-[#FF6B6B] sm:text-xs">{saveError}</p>}
        </section>
      )}

      {/* No Cards Selected */}
      {!isLoading && !error && !isComplete && !card && (
        <div className="border-2 border-black bg-[#1f2637] p-6 text-center text-white shadow-[4px_4px_0px_0px_#000000] sm:p-10">
          <p className="font-mono text-xs font-black uppercase text-neutral-300 sm:text-sm">
            No Kana cards selected.
          </p>
          <button
            type="button"
            onClick={onOpenFilter}
            className="mt-4 cursor-pointer border-2 border-black bg-[#FFDE59] px-4 py-2 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Change selection
          </button>
        </div>
      )}

      {/* Active Card */}
      {!isLoading && !error && !isComplete && card && (
        <section className="border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000000]">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 font-mono text-[10px] font-black uppercase sm:text-xs">
            <span className="text-[#FFDE59]">{card.groupName}</span>
            <span className="text-neutral-400">
              {cardIndex + 1} / {activeCards.length}
            </span>
          </div>

          {/* Large Kana Display Box */}
          <div className="my-3 border-2 border-black bg-[#151922] p-4 text-center shadow-[3px_3px_0px_0px_#000000] sm:my-6 sm:p-8 sm:shadow-[4px_4px_0px_0px_#000000]">
            <div className="kana-font text-7xl font-black leading-none text-white sm:text-9xl">
              {card.kana}
            </div>
          </div>

          {/* Form State */}
          {!attempt ? (
            <form onSubmit={submitAnswer} className="space-y-2.5 sm:space-y-3">
              <label htmlFor="kana-answer" className="block font-mono text-[10px] font-black uppercase text-neutral-300 sm:text-xs">
                Type the romaji reading (Enter to submit)
              </label>
              <input
                id="kana-answer"
                ref={inputRef}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="h-10 w-full border-2 border-black bg-[#151922] px-3 font-mono text-base font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_#000000] outline-none placeholder:font-sans placeholder:text-xs placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-500 focus:border-[#FFDE59] focus:ring-0 sm:h-12 sm:px-4 sm:text-xl"
                placeholder="romaji"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!answer.trim()}
                  className="cursor-pointer border-2 border-black bg-[#A3E636] px-5 py-2 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500 disabled:opacity-50 disabled:shadow-none sm:py-2.5"
                >
                  Check answer ↵
                </button>
              </div>
            </form>
          ) : (
            /* Result State */
            <div className="space-y-3 sm:space-y-4">
              <div
                className={`border-2 border-black p-2.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] sm:p-3 sm:text-sm ${attempt.correct ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
                  }`}
              >
                {attempt.correct ? 'CORRECT!' : `Not quite. Answer: ${card.romaji}`}
              </div>

              {/* Streak Mastery Info */}
              <div className="grid grid-cols-3 items-center gap-1.5 border-2 border-black bg-[#151922] p-2.5 shadow-[2px_2px_0px_0px_#000] sm:p-3">
                <div className="text-center">
                  <span className="block font-mono text-base font-black text-white sm:text-2xl">
                    {streak}/{MASTERY_TARGET}
                  </span>
                  <span className="font-mono text-[8px] font-black uppercase text-neutral-400 sm:text-[10px]">Streak</span>
                </div>
                <div className="flex items-center justify-center">
                  <span
                    className={`inline-block border-2 border-black px-2 py-0.5 font-mono text-[8px] font-black uppercase shadow-[1px_1px_0px_0px_#000] sm:px-2.5 sm:py-1 sm:text-[10px] ${masteryBadge.chipClass}`}
                  >
                    {masteryBadge.label}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block font-mono text-base font-black text-white sm:text-2xl">{totalAttempts}</span>
                  <span className="font-mono text-[8px] font-black uppercase text-neutral-400 sm:text-[10px]">Attempts</span>
                </div>
              </div>

              {/* Example Word */}
              {card.example && (
                <div className="border-2 border-black bg-[#151922] border-l-4 border-l-[#70CFF8] p-2.5 shadow-[2px_2px_0px_0px_#000] sm:p-3.5">
                  <p className="jp-font text-base font-black text-white sm:text-lg">{card.example[0]}</p>
                  <p className="font-mono text-[10px] font-bold text-neutral-300 sm:text-xs">
                    {card.example[1]} | {card.example[2]}
                  </p>
                </div>
              )}

              {/* Next Button Footer */}
              <div className="flex flex-col gap-2 border-t-2 border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
                <span className="font-mono text-[9px] font-bold uppercase text-neutral-400 sm:text-[10px]">
                  Press Enter for next character
                </span>
                <button type="button" onClick={moveNext} className={NEXT_BUTTON_CLASSES}>
                  {cardIndex === activeCards.length - 1 ? 'Finish session →' : 'Next character →'}
                </button>
              </div>

              {saveError && (
                <p className="font-mono text-[10px] font-bold text-[#FF6B6B] sm:text-xs">{saveError}</p>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default KanaRecall;