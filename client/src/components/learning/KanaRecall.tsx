import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react';
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons';
import {
  getCharacterAttempts,
  getKanaCards,
  recordCharacterAttempt,
  updateCharacterConfidenceBatch,
} from '../../services/api';
import { buildKanaAttempt } from '../../utils/kanaRecall';
import type { Confidence, KanaCard } from '../../types';

/** Kana recall augments the fetched cards with a client-side id + confidence. */
type KanaRecallCard = KanaCard & { id: string };

type KanaAttempt = {
  correct: boolean;
  confidence: Confidence;
  [key: string]: unknown;
};

type ReviewItem = KanaRecallCard & {
  confidence: Confidence;
  originalConfidence: Confidence;
};

type KanaRecallProps = {
  onBack: () => void;
  onOpenFilter: () => void;
  onReviewComplete: () => void;
  selectedKana?: Set<string>;
};

const CONFIDENCE_OPTIONS = [
  { value: 'again', label: 'Again', icon: ExclamationTriangleIcon, color: '#FFDE59' },
  { value: 'hard', label: 'Hard', icon: LightningBoltIcon, color: '#FF6B6B' },
  { value: 'easy', label: 'Easy', icon: CheckCircledIcon, color: '#A3E636' },
  { value: null, label: 'Unrated', icon: null, color: '#FFFFFF' },
];

function KanaRecall({ onBack, onOpenFilter, onReviewComplete, selectedKana }: KanaRecallProps) {
  const [cards, setCards] = useState<KanaRecallCard[]>([]);
  const [confidenceById, setConfidenceById] = useState<Record<string, Confidence>>({});
  const [sessionConfidenceById, setSessionConfidenceById] = useState<Record<string, Confidence>>({});
  const [cardIndex, setCardIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [attempt, setAttempt] = useState<KanaAttempt | null>(null);
  const [confidence, setConfidence] = useState<Confidence>(null);
  const [isHintUsed, setIsHintUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewChanges, setReviewChanges] = useState<Record<string, Confidence>>({});
  const [isSavingReview, setIsSavingReview] = useState(false);

  useEffect(() => {
    Promise.all([getKanaCards(), getCharacterAttempts('kana')])
      .then(([cardsData, attemptsData]) => {
        setCards(Array.isArray(cardsData?.cards) ? cardsData.cards as KanaRecallCard[] : []);
        setConfidenceById((attemptsData?.attempts as unknown[] || []).reduce<Record<string, Confidence>>((result, item) => {
          const savedItem = item as { character_id?: string; confidence?: Confidence };
          if (savedItem.character_id && savedItem.confidence) result[savedItem.character_id] = savedItem.confidence;
          return result;
        }, {}));
      })
      .catch(() => setError('Unable to load Kana recall. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const activeCards = useMemo(() => {
    const selected = selectedKana && selectedKana.size > 0;
    const filtered = selected ? cards.filter((card) => selectedKana.has(card.kana)) : cards;
    return filtered;
  }, [cards, confidenceById, selectedKana]);

  const card = activeCards[cardIndex];

  useEffect(() => {
    setCardIndex((current) => Math.min(current, Math.max(activeCards.length - 1, 0)));
  }, [activeCards.length]);

  const resetCard = () => {
    setAnswer('');
    setAttempt(null);
    setIsHintUsed(false);
    setSaveError('');
  };

  useEffect(() => {
    if (!card) return;
    setAttempt(null);
    setConfidence(sessionConfidenceById[card.id] ?? confidenceById[card.id] ?? null);
    setAnswer('');
    setIsHintUsed(false);
    setSaveError('');
  }, [card]);

  const moveNext = () => {
    if (cardIndex === activeCards.length - 1) {
      const nextReviewItems = activeCards.map((reviewCard) => ({
        ...reviewCard,
        confidence: reviewCard.id === card.id
          ? confidence
          : sessionConfidenceById[reviewCard.id] ?? confidenceById[reviewCard.id] ?? null,
        originalConfidence: confidenceById[reviewCard.id] || null,
      }));
      setReviewItems(nextReviewItems);
      setReviewChanges(Object.fromEntries(
        nextReviewItems
          .filter(({ confidence, originalConfidence }) => confidence && confidence !== originalConfidence)
          .map(({ id, confidence }) => [id, confidence]),
      ));
      setSaveError('');
      setIsReviewing(true);
      return;
    }
    setCardIndex((current) => (current + 1) % activeCards.length);
    resetCard();
  };

  const submitAnswer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!card || attempt || !answer.trim()) return;
    const nextAttempt = buildKanaAttempt({ card, answer, usedHint: isHintUsed });
    setAttempt({ ...nextAttempt, confidence });
    try {
      const result = await recordCharacterAttempt(nextAttempt);
      const savedAttempt = result?.attempt as { character_id?: string } | undefined;
      if (savedAttempt?.character_id && savedAttempt.character_id !== card.id) {
        setSaveError('Kana character identity did not match the selected card.');
      }
    } catch {
      setSaveError('Attempt saved for this session, but could not sync to your profile.');
    }
  };

  const rateCard = (confidence: Confidence) => {
    if (!attempt || !card) return;
    setConfidence(confidence);
    setAttempt((current) => current ? { ...current, confidence } : current);
    setSessionConfidenceById((current) => ({ ...current, [card.id]: confidence }));
  };

  const moveReviewCard = (characterId: string, nextConfidence: Confidence) => {
    const reviewCard = reviewItems.find((item) => item.id === characterId);
    if (!reviewCard) return;

    setReviewItems((current) => current.map((item) => (
      item.id === characterId ? { ...item, confidence: nextConfidence } : item
    )));
    setReviewChanges((current) => {
      const next = { ...current };
      if (reviewCard.originalConfidence === nextConfidence) {
        delete next[characterId];
      } else {
        next[characterId] = nextConfidence;
      }
      return next;
    });
  };

  const saveReview = async () => {
    setIsSavingReview(true);
    setSaveError('');
    try {
      const updates = Object.entries(reviewChanges).map(([characterId, confidence]) => {
        const reviewCard = reviewItems.find((item) => item.id === characterId);
        if (!reviewCard) throw new Error('Review card not found');
        return {
          characterId,
          character: reviewCard.kana,
          characterType: 'kana',
          confidence,
        };
      });
      if (updates.length > 0) await updateCharacterConfidenceBatch(updates);
      onReviewComplete();
    } catch {
      setSaveError('Unable to save Kana confidence ratings. Please try again.');
    } finally {
      setIsSavingReview(false);
    }
  };

  return (
    <main className="container mx-auto max-w-3xl space-y-3.5 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Back"
          >
            <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
          </button>
          <div>
            <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
          // ACTIVE RECALL: KANA
            </span>
            <h1 className="text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              Read the character
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenFilter}
          className="border-2 border-black bg-[#A3E636] px-2.5 py-1 sm:px-3 sm:py-2 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          {activeCards.length} CARDS
        </button>
      </div>

      {isLoading && (
        <div className="border-2 border-black bg-[#1a1f2c] p-8 sm:p-12 text-center font-mono text-xs sm:text-base font-black uppercase text-white">
          Loading recall...
        </div>
      )}

      {error && (
        <div className="border-2 border-black bg-[#FF6B6B] p-3 sm:p-4 font-mono text-xs sm:text-sm font-black uppercase text-black">
          {error}
        </div>
      )}

      {/* Session Review Screen */}
      {!isLoading && !error && isReviewing && (
        <section className="space-y-3 sm:space-y-5 border-2 border-black bg-[#FFDE59] p-3.5 sm:p-8 text-black shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
          <div className="border-b-2 border-black pb-2 sm:pb-4">
            <span className="font-mono text-[9px] sm:text-xs font-black uppercase tracking-wider">
          // SESSION REVIEW
            </span>
            <h2 className="mt-0.5 sm:mt-1 text-xl sm:text-3xl font-black uppercase tracking-tight">
              Save your confidence
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-bold leading-tight">
              Your ratings will be saved together for this Kana session.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
            {CONFIDENCE_OPTIONS.map(({ value, label, icon: Icon, color }) => {
              const levelKey = value || 'unrated';
              const items = reviewItems.filter((item) => item.confidence === value);
              return (
                <div
                  key={levelKey}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const characterId = event.dataTransfer.getData('text/plain');
                    if (characterId) moveReviewCard(characterId, value as Confidence);
                  }}
                  className="min-h-28 sm:min-h-40 border-2 border-black bg-white p-2 sm:p-3 shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="flex items-center gap-1.5 border-b-2 border-black pb-1 sm:pb-2">
                    <span
                      className="flex h-5 w-5 sm:h-8 sm:w-8 items-center justify-center border-2 border-black"
                      style={{ backgroundColor: color }}
                    >
                      {Icon ? <Icon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" /> : <span className="font-black text-[10px]">?</span>}
                    </span>
                    <span className="font-mono text-[9px] sm:text-xs font-black uppercase truncate">{label}</span>
                    <span className="ml-auto font-mono text-[9px] sm:text-xs font-black">{items.length}</span>
                  </div>
                  <div className="mt-1.5 flex min-h-12 sm:min-h-20 flex-wrap content-start gap-1 sm:gap-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
                        className="flex h-7 w-7 sm:h-12 sm:w-12 cursor-grab items-center justify-center border-2 border-black bg-[#F3F4F6] text-sm sm:text-2xl font-black shadow-[1px_1px_0px_0px_#000] active:cursor-grabbing"
                        title={`Move ${item.kana}`}
                        aria-label={`${item.kana}, ${label}`}
                      >
                        <span className="kana-font">{item.kana}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {saveError && (
            <div className="border-2 border-black bg-[#FF6B6B] p-2 font-mono text-[10px] sm:text-xs font-black uppercase">
              {saveError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-black pt-2.5 sm:pt-4">
            <span className="font-mono text-[9px] sm:text-xs font-black uppercase">
              {Object.keys(reviewChanges).length} ratings changed
            </span>
            <button
              type="button"
              onClick={saveReview}
              disabled={isSavingReview}
              className="border-2 border-black bg-black px-3.5 py-1.5 sm:px-6 sm:py-3 font-mono text-[10px] sm:text-sm font-black uppercase text-[#FFDE59] shadow-[2px_2px_0px_0px_#000000] disabled:cursor-wait disabled:opacity-50"
            >
              {isSavingReview ? 'Saving...' : 'Save review'}
            </button>
          </div>
        </section>
      )}

      {/* No Cards Empty State */}
      {!isLoading && !error && !card && (
        <div className="border-2 border-black bg-[#1a1f2c] p-6 sm:p-10 text-center text-white shadow-[4px_4px_0px_0px_#000000]">
          <p className="font-mono text-xs sm:text-sm font-black uppercase text-neutral-300">
            No Kana cards need review.
          </p>
          <button
            type="button"
            onClick={onOpenFilter}
            className="mt-4 sm:mt-6 border-2 border-black bg-[#A3E636] px-4 py-2 sm:px-5 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]"
          >
            Change selection
          </button>
        </div>
      )}

      {/* Active Practice Card */}
      {!isLoading && !error && card && !isReviewing && (
        <section className="border-2 border-black bg-[#FFDE59] p-3.5 sm:p-8 text-black shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
          {/* Card Info Header */}
          <div className="flex justify-between border-b-2 border-black pb-2 font-mono text-[10px] sm:text-xs font-black uppercase">
            <span>{card.groupName}</span>
            <span>{cardIndex + 1} / {activeCards.length}</span>
          </div>

          {/* Confidence Indicators */}
          <div className="mt-2 sm:mt-3 flex items-center justify-end gap-1.5 sm:gap-2" aria-label="Confidence rating">
            <span className="mr-1 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black/70">
              Confidence
            </span>
            {CONFIDENCE_OPTIONS.slice(0, 3).map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => rateCard(value as Confidence)}
                disabled={!attempt}
                title={`${label}: ${value === 'again' ? 'review soon' : value === 'hard' ? 'needs practice' : 'felt easy'}`}
                aria-label={`${label} confidence`}
                className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center border-2 border-black text-black shadow-[1.5px_1.5px_0px_0px_#000000] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${confidence === value
                    ? 'translate-x-[1px] translate-y-[1px] shadow-none ring-2 ring-black'
                    : 'hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
                style={{ backgroundColor: color }}
              >
                {Icon && <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" aria-hidden="true" />}
              </button>
            ))}
          </div>

          {/* Character Box */}
          <div className="my-3 sm:my-8 border-2 border-black bg-white p-3 sm:p-8 text-center shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
            <div className="kana-font text-7xl sm:text-9xl font-black leading-none">{card.kana}</div>
          </div>

          {/* Answer Form */}
          {!attempt ? (
            <form onSubmit={submitAnswer} className="space-y-2 sm:space-y-3">
              <label htmlFor="kana-answer" className="font-mono text-[10px] sm:text-xs font-black uppercase">
                Type the romaji reading
              </label>
              <input
                id="kana-answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                autoFocus
                className="h-10 sm:h-12 w-full border-2 border-black bg-white px-3 sm:px-4 font-mono text-base sm:text-xl font-black outline-none shadow-[2px_2px_0px_0px_#000000] placeholder:font-sans placeholder:text-sm placeholder:font-normal"
                placeholder="romaji"
              />
              <div className="flex flex-wrap gap-2 pt-0.5">
                <button
                  type="submit"
                  className="border-2 border-black bg-[#A3E636] px-3.5 py-1.5 sm:px-5 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  Check answer
                </button>
                <button
                  type="button"
                  onClick={() => setIsHintUsed(true)}
                  className="border-2 border-black bg-white px-3.5 py-1.5 sm:px-5 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  Show hint
                </button>
              </div>
              {isHintUsed && (
                <p className="border-2 border-black bg-white p-2 font-mono text-xs sm:text-sm font-black">
                  Hint: {card.romaji}
                </p>
              )}
            </form>
          ) : (
            <div className="space-y-2.5 sm:space-y-4">
              <div
                className={`border-2 border-black p-2.5 sm:p-4 font-mono text-xs sm:text-sm font-black uppercase ${attempt.correct ? 'bg-[#A3E636]' : 'bg-[#FF6B6B]'
                  }`}
              >
                {attempt.correct ? 'Correct' : `Not quite. Answer: ${card.romaji}`}
              </div>
              {card.example && (
                <div className="border-2 border-black bg-white p-2.5 sm:p-4">
                  <p className="jp-font text-base sm:text-xl font-black">{card.example[0]}</p>
                  <p className="font-mono text-[10px] sm:text-xs font-bold text-neutral-700">
                    {card.example[1]} | {card.example[2]}
                  </p>
                </div>
              )}
              <div className="flex justify-end border-t-2 border-black pt-2.5 sm:pt-4">
                <button
                  type="button"
                  onClick={moveNext}
                  disabled={!confidence}
                  className="border-2 border-black bg-black px-4 py-1.5 sm:px-5 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase text-[#FFDE59] shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {cardIndex === activeCards.length - 1 ? 'Review' : 'Next character'}
                </button>
              </div>
              {saveError && <p className="font-mono text-[10px] sm:text-xs font-bold text-red-600">{saveError}</p>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default KanaRecall;