import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { getKanjiAttempts, getKanjiCards, recordKanjiAttempt, updateKanjiConfidenceBatch } from '../../services/api';
import type { KanjiCard } from '../../types';
import {
  buildKanjiAttempt,
  getKanjiHint,
  getKanjiPromptAnswer,
  KANJI_PROMPT_MODES,
} from '../../utils/kanjiRecall';
import {
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons';

const CONFIDENCE_OPTIONS = [
  { level: 'again', label: 'Again', icon: ExclamationTriangleIcon, color: '#FFDE59', description: 'Review soon' },
  { level: 'hard', label: 'Hard', icon: LightningBoltIcon, color: '#FF6B6B', description: 'Needs practice' },
  { level: 'easy', label: 'Easy', icon: CheckCircledIcon, color: '#A3E636', description: 'Mastered / easy' },
  { level: 'unrated', label: 'Unrated', icon: null, color: '#FFFFFF', description: 'No confidence rating' },
];

type ConfidenceLevel = 'again' | 'hard' | 'easy' | 'unrated';

type KanjiStudyCard = KanjiCard & {
  reading?: string;
  meaning?: string;
  example?: [string, string, string];
};

type KanjiGroup = {
  id: string;
  name: string;
};

type ReviewItem = KanjiStudyCard & {
  confidence: ConfidenceLevel | null;
  originalConfidence: ConfidenceLevel | null;
};

type KanjiData = {
  cards: KanjiStudyCard[];
  groups: KanjiGroup[];
};

type KanjiStudyProps = {
  onBack: () => void;
};

type KanjiAttempt = {
  character: string;
  promptMode: string;
  answer: string;
  correct: boolean;
  confidence: ConfidenceLevel | null;
  usedHint: boolean;
  skipped?: boolean;
};

function KanjiStudy({ onBack }: KanjiStudyProps) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedConfidenceLevels, setSelectedConfidenceLevels] = useState<ConfidenceLevel[]>(['unrated', 'again', 'hard', 'easy']);
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [promptMode, setPromptMode] = useState<string>(KANJI_PROMPT_MODES.READING);
  const [answer, setAnswer] = useState('');
  const [attempt, setAttempt] = useState<KanjiAttempt | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [retryCards, setRetryCards] = useState<KanjiStudyCard[]>([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [persistenceError, setPersistenceError] = useState('');
  const [confidenceByCharacter, setConfidenceByCharacter] = useState<Record<string, ConfidenceLevel>>({});
  const [isLearning, setIsLearning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewChanges, setReviewChanges] = useState<Record<string, ConfidenceLevel | null>>({});
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [kanjiData, setKanjiData] = useState<KanjiData>({ cards: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getKanjiCards(), getKanjiAttempts()])
      .then(([cardsData, attemptsData]) => {
        setKanjiData({
          cards: cardsData.cards as KanjiStudyCard[],
          groups: (cardsData.groups || []) as KanjiGroup[],
        });
        const savedConfidence = (attemptsData?.attempts || []).reduce((current, savedAttempt) => {
          if (savedAttempt.character && savedAttempt.confidence) {
            current[savedAttempt.character] = savedAttempt.confidence;
          }
          return current;
        }, {});
        setConfidenceByCharacter(savedConfidence as Record<string, ConfidenceLevel>);
      })
      .catch(() => setError('Unable to load Kanji cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const groupFilteredCards = selectedGroups.length === 0
    ? kanjiData.cards
    : kanjiData.cards.filter((card) => card.groupId !== undefined && selectedGroups.includes(card.groupId));

  const cards = groupFilteredCards.filter((kanjiCard) => {
    const savedConfidence = confidenceByCharacter[kanjiCard.kanji] || 'unrated';
    return selectedConfidenceLevels.includes(savedConfidence);
  });

  const activeCards = isRetryMode ? retryCards : cards;
  const card = activeCards[cardIndex];

  const answerRef = useRef<HTMLInputElement>(null);
  const confidenceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnswer('');
    setAttempt(null);
    setConfidence(null);
    setUsedHint(false);
    setPersistenceError('');
    setIsRevealed(false);
    answerRef.current?.focus();
  }, [cardIndex, isRetryMode, promptMode]);

  useEffect(() => {
    if (!card || attempt) return;
    setConfidence(confidenceByCharacter[card.kanji] || null);
  }, [card, confidenceByCharacter, attempt]);

  useEffect(() => {
    if (!attempt || !confidence) return;

    setPersistenceError('');
    recordKanjiAttempt({
      ...attempt,
      confidence,
    }).catch(() => {
      setPersistenceError('Attempt saved for this session, but could not sync to your profile.');
    });
  }, [attempt, confidence]);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((current) => current.includes(groupId)
      ? current.filter((selected) => selected !== groupId)
      : [...current, groupId]);
    setCardIndex(0);
    setIsRevealed(false);
    setIsRetryMode(false);
    setRetryCards([]);
  };

  const selectAllGroups = () => {
    setSelectedGroups([]);
    setCardIndex(0);
    setIsRevealed(false);
    setIsRetryMode(false);
    setRetryCards([]);
  };

  const toggleConfidenceLevel = (levelKey: ConfidenceLevel) => {
    setSelectedConfidenceLevels((current) => {
      if (current.includes(levelKey)) {
        if (current.length === 1) return current; // keep at least one active
        return current.filter((k) => k !== levelKey);
      }
      return [...current, levelKey];
    });
    setCardIndex(0);
    setIsRevealed(false);
    setIsRetryMode(false);
    setRetryCards([]);
  };

  const setAllLevels = () => {
    setSelectedConfidenceLevels(['unrated', 'again', 'hard', 'easy']);
    setCardIndex(0);
  };

  const setSkipEasy = () => {
    setSelectedConfidenceLevels(['unrated', 'again', 'hard']);
    setCardIndex(0);
  };

  const moveCard = (direction: number) => {
    setCardIndex((current) => (current + direction + activeCards.length) % activeCards.length);
    setIsRevealed(false);
  };

  const advanceCard = () => {
    if (cardIndex === activeCards.length - 1) {
      setReviewItems(cards.map((reviewCard) => ({
        ...reviewCard,
        confidence: confidenceByCharacter[reviewCard.kanji] || null,
        originalConfidence: confidenceByCharacter[reviewCard.kanji] || null,
      })));
      setReviewChanges({});
      setReviewError('');
      setIsLearning(false);
      setIsReviewing(true);
      return;
    }
    moveCard(1);
  };

  const submitAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!card || attempt || !answer.trim()) return;

    const nextAttempt = buildKanjiAttempt({
      card,
      promptMode,
      answer,
      confidence,
      usedHint,
    });
    setAttempt(nextAttempt);
    setIsRevealed(true);
    if (!confidenceByCharacter[card.kanji]) {
      window.requestAnimationFrame(() => confidenceRef.current?.focus());
    }
    if (!nextAttempt.correct) {
      setRetryCards((current) => current.some((item) => item.kanji === card.kanji)
        ? current
        : [...current, card]);
    }
  };

  const skipAnswer = () => {
    if (!card || attempt) return;
    const nextAttempt = {
      ...buildKanjiAttempt({
        card,
        promptMode,
        answer: 'skip',
        confidence,
        usedHint,
      }),
      skipped: true,
    };
    setAttempt(nextAttempt);
    setIsRevealed(true);
    if (!confidenceByCharacter[card.kanji]) {
      window.requestAnimationFrame(() => confidenceRef.current?.focus());
    }
  };

  const rateConfidence = (level: ConfidenceLevel) => {
    if (!attempt) return;
    setConfidence(level);
    setConfidenceByCharacter((current) => ({ ...current, [card.kanji]: level }));
  };

  const startLearning = () => {
    if (cards.length === 0) return;
    setCardIndex(0);
    setIsRetryMode(false);
    setIsLearning(true);
  };

  const moveReviewCard = (character: string, nextConfidence: ConfidenceLevel | null) => {
    const reviewCard = reviewItems.find((item) => item.kanji === character);
    if (!reviewCard) return;

    setReviewItems((current) => current.map((item) => (
      item.kanji === character ? { ...item, confidence: nextConfidence } : item
    )));
    setReviewChanges((current) => {
      const next = { ...current };
      if (reviewCard.originalConfidence === nextConfidence) {
        delete next[character];
      } else {
        next[character] = nextConfidence;
      }
      return next;
    });
  };

  const saveReview = async () => {
    const updates = Object.entries(reviewChanges).map(([character, confidence]) => ({ character, confidence }));
    setIsSavingReview(true);
    setReviewError('');
    try {
      if (updates.length > 0) {
        await updateKanjiConfidenceBatch(updates);
        setConfidenceByCharacter((current) => {
          const next = { ...current };
          updates.forEach((update) => {
            if (update.confidence) next[update.character] = update.confidence;
          });
          return next;
        });
      }
      setIsReviewing(false);
    } catch {
      setReviewError('Unable to save the moved confidence ratings. Please try again.');
    } finally {
      setIsSavingReview(false);
    }
  };

  const startRetry = () => {
    if (retryCards.length === 0) return;
    setIsRetryMode(true);
    setCardIndex(0);
    setAttempt(null);
    setConfidence(null);
    setAnswer('');
  };

  const confidenceOptions = CONFIDENCE_OPTIONS.slice(0, 3);
  const confidenceLevels = CONFIDENCE_OPTIONS.map((opt) => ({
    ...opt,
    level: opt.level === 'unrated' ? null : opt.level,
  }));

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* 1. Cleaned-Up Header Bar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to previous screen"
        >
          <span className="font-mono text-lg font-black">&lt;</span>
        </button>

        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // PRACTICE: KANJI DECK
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight sm:text-3xl">
            Reading Foundation
          </h1>
        </div>
      </div>

      {/* 2. Review Screen */}
      {!isLoading && !error && isReviewing && (
        <section className="space-y-5 border-2 border-black bg-[#FFDE59] p-5 text-black shadow-[6px_6px_0px_0px_#000000] sm:p-8">
          <div className="border-b-2 border-black pb-4">
            <span className="font-mono text-xs font-black uppercase tracking-wider">// SESSION REVIEW</span>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-tight">Sort your confidence</h2>
            <p className="mt-2 text-sm font-bold">Move any character that changed for you. Only moved characters will be updated.</p>
          </div>

          {reviewError && <div className="border-2 border-black bg-[#FF6B6B] p-3 font-mono text-xs font-black uppercase">{reviewError}</div>}

          <div className="grid gap-4 md:grid-cols-4">
            {confidenceLevels.map(({ level, label, icon: Icon, color }) => {
              const levelKey = level || 'unrated';
              const items = reviewItems.filter((item) => item.confidence === level);
              return (
                <div
                  key={levelKey}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const character = event.dataTransfer.getData('text/plain');
                    if (character) moveReviewCard(character, level as ConfidenceLevel | null);
                  }}
                  className="min-h-40 border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]"
                >
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <span className="flex h-8 w-8 items-center justify-center border-2 border-black" style={{ backgroundColor: color }}>
                      {Icon ? <Icon className="h-4 w-4 text-black" aria-hidden="true" /> : <span className="font-black text-black">?</span>}
                    </span>
                    <span className="font-mono text-xs font-black uppercase">{label}</span>
                    <span className="ml-auto font-mono text-xs font-black">{items.length}</span>
                  </div>
                  <div className="mt-3 flex min-h-20 flex-wrap content-start gap-2">
                    {items.map((item) => (
                      <div
                        key={item.kanji}
                        draggable
                        onDragStart={(event) => event.dataTransfer.setData('text/plain', item.kanji)}
                        className="flex h-12 w-12 cursor-grab items-center justify-center border-2 border-black bg-[#F3F4F6] text-2xl font-black shadow-[2px_2px_0px_0px_#000] active:cursor-grabbing"
                        title={`Move ${item.kanji}`}
                        aria-label={`${item.kanji}, ${label}`}
                      >
                        {item.kanji}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4">
            <span className="font-mono text-xs font-black uppercase">{Object.keys(reviewChanges).length} ratings changed</span>
            <button type="button" onClick={saveReview} disabled={isSavingReview} className="border-2 border-black bg-black px-6 py-3 font-mono text-sm font-black uppercase text-[#FFDE59] shadow-[4px_4px_0px_0px_#000] disabled:cursor-wait disabled:opacity-50">
              {isSavingReview ? 'Saving...' : 'Save review'}
            </button>
          </div>
        </section>
      )}

      {/* 3. Streamlined Setup Screen */}
      {!isLoading && !error && !isLearning && !isReviewing && (
        <section className="space-y-6 border-2 border-black bg-[#FFDE59] p-6 text-black shadow-[6px_6px_0px_0px_#000000] sm:p-8">
          <div className="border-b-2 border-black pb-4">
            <span className="font-mono text-xs font-black uppercase tracking-wider">// STUDY SETUP</span>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-tight">Choose your Kanji mission</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold">
              Select your prompt mode, target groups, and confidence levels to shape your practice session.
            </p>
          </div>

          {/* Prompt Mode Selector */}
          <div>
            <h3 className="font-mono text-xs font-black uppercase text-black">1. Prompt Mode</h3>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              {Object.entries(KANJI_PROMPT_MODES).map(([label, mode]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPromptMode(mode)}
                  className={`border-2 border-black p-4 text-left font-mono shadow-[3px_3px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                    promptMode === mode ? 'bg-[#A3E636] text-black' : 'bg-white hover:bg-neutral-100'
                  }`}
                >
                  <span className="block text-xs font-black uppercase">{label} mode</span>
                  <span className="mt-1 block text-xs font-bold text-black/80">
                    {mode === KANJI_PROMPT_MODES.READING ? 'Type the romaji reading for each Kanji.' : 'Type the English meaning for each Kanji.'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Group Filter Section */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-mono text-xs font-black uppercase text-black">2. Kanji Groups</h3>
              <button
                type="button"
                onClick={selectAllGroups}
                className={`border-2 border-black px-2.5 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                  selectedGroups.length === 0 ? 'bg-[#70CFF8] text-black' : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                {selectedGroups.length === 0 ? '✓ All Kanji Active' : 'Select All Groups'}
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {kanjiData.groups.map((group) => {
                const isSelected = selectedGroups.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={`border-2 border-black px-3 py-1.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                      isSelected ? 'bg-[#70CFF8] text-black' : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    {group.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Confidence Levels */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-mono text-xs font-black uppercase text-black">3. Target Confidence</h3>
                <p className="font-mono text-[10px] text-black/70">Pick the ratings you want to include in this session</p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={setAllLevels}
                  className={`border-2 border-black px-2.5 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                    selectedConfidenceLevels.length === 4 ? 'bg-[#70CFF8]' : 'bg-white hover:bg-neutral-100'
                  }`}
                >
                  All Cards
                </button>
                <button
                  type="button"
                  onClick={setSkipEasy}
                  className={`border-2 border-black px-2.5 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                    selectedConfidenceLevels.length === 3 && !selectedConfidenceLevels.includes('easy')
                      ? 'bg-[#70CFF8]'
                      : 'bg-white hover:bg-neutral-100'
                  }`}
                >
                  Skip Easy
                </button>
              </div>
            </div>

            <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CONFIDENCE_OPTIONS.map(({ level, label, icon: Icon, color, description }) => {
                const isSelected = selectedConfidenceLevels.includes(level as ConfidenceLevel);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => toggleConfidenceLevel(level as ConfidenceLevel)}
                    aria-pressed={isSelected}
                    className={`flex flex-col justify-between border-2 border-black p-3.5 text-left font-mono transition-all shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                      isSelected ? 'bg-white' : 'bg-neutral-200/80 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="flex h-7 w-7 items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_#000]"
                          style={{ backgroundColor: color }}
                        >
                          {Icon ? <Icon className="h-4 w-4 text-black" aria-hidden="true" /> : <span className="font-black text-xs text-black">?</span>}
                        </span>
                        <span className={`border border-black px-1.5 py-0.5 text-[9px] font-black uppercase ${isSelected ? 'bg-[#A3E636]' : 'bg-white'}`}>
                          {isSelected ? 'Included' : 'Excluded'}
                        </span>
                      </div>
                      <span className="mt-2.5 block text-xs font-black uppercase text-black">{label}</span>
                      <span className="mt-0.5 block text-[11px] font-bold text-neutral-600">{description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Section */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4">
            <span className="font-mono text-xs font-black uppercase">{cards.length} cards matched</span>
            <button
              type="button"
              onClick={startLearning}
              disabled={cards.length === 0}
              className="border-2 border-black bg-black px-6 py-3 font-mono text-sm font-black uppercase text-[#FFDE59] shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start learning →
            </button>
          </div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center border-2 border-black bg-[#1a1f2c] py-20 shadow-[6px_6px_0px_0px_#000000]">
          <div className="h-4 w-32 bg-[#252c3d] animate-pulse mb-6" />
          <div className="h-28 w-28 bg-[#252c3d] animate-pulse mb-6" />
          <div className="h-10 w-36 bg-[#252c3d] animate-pulse" />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="border-2 border-black bg-[#FF6B6B] p-4 text-center font-mono text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000000]">
          {error}
        </div>
      )}

      {/* Flashcard Active Mode */}
      {!isLoading && !error && isLearning && card && (
        <div className="relative border-2 border-black bg-[#FFDE59] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <span className="border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FFDE59]">
              {card.groupName || 'N5 Kanji'}
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black">
              {isRetryMode ? 'RETRY' : 'CARD'} {cardIndex + 1} OF {activeCards.length}
            </span>
          </div>

          <div ref={confidenceRef} tabIndex={-1} className="mt-3 flex items-center justify-end gap-2 outline-none" aria-label="Confidence rating">
            <span className="mr-1 font-mono text-[10px] font-black uppercase text-black/70">Confidence</span>
            {confidenceOptions.map(({ level, label, icon: Icon, color }) => (
              <button
                key={level}
                type="button"
                onClick={() => rateConfidence(level as ConfidenceLevel)}
                disabled={!attempt}
                title={`${label}: ${level === 'again' ? 'review soon' : level === 'hard' ? 'needs practice' : 'felt easy'}`}
                aria-label={`${label} confidence`}
                className={`flex h-9 w-9 items-center justify-center border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                  confidence === level ? 'translate-x-[1px] translate-y-[1px] shadow-none ring-2 ring-black' : 'hover:translate-x-[1px] hover:translate-y-[1px]'
                }`}
                style={{ backgroundColor: color }}
              >
                {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="my-6 flex justify-center">
            <div className="flex h-36 w-36 items-center justify-center border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000] sm:h-44 sm:w-44">
              <span className="kana-font select-none text-7xl sm:text-8xl font-black text-black leading-none">
                {card.kanji}
              </span>
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]">
            <div className="flex items-center justify-between pb-1.5">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-neutral-500">
                // {promptMode === KANJI_PROMPT_MODES.READING ? 'PROMPT: ROMAJI READING' : 'PROMPT: ENGLISH MEANING'}
              </span>
              {usedHint && (
                <span className="font-mono text-[10px] font-black uppercase text-[#d97706]">• Hint used</span>
              )}
            </div>

            {!attempt ? (
              <form onSubmit={submitAnswer} className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  ref={answerRef}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder={
                    promptMode === KANJI_PROMPT_MODES.READING
                      ? 'e.g. yon, shi...'
                      : 'e.g. four, person...'
                  }
                  className="h-11 min-w-0 flex-1 border-2 border-black px-3.5 font-mono text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000000] focus:bg-[#f3f9ff] focus:outline-none"
                  aria-label={promptMode === KANJI_PROMPT_MODES.READING ? 'Kanji reading' : 'Kanji meaning'}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!answer.trim()}
                    className="h-11 flex-1 sm:flex-none border-2 border-black bg-[#A3E636] px-5 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Check
                  </button>
                  <button
                    type="button"
                    onClick={skipAnswer}
                    className="h-11 border-2 border-black bg-neutral-100 px-3.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] hover:bg-neutral-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                  >
                    Skip
                  </button>
                </div>
              </form>
            ) : (
              <div
                className={`mt-2 border-2 border-black p-3 font-mono text-sm font-black shadow-[2px_2px_0px_0px_#000000] ${
                  attempt.skipped ? 'bg-[#70CFF8] text-black' : attempt.correct ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
                }`}
              >
                {attempt.skipped ? `↷ Skipped. Expected: ${getKanjiPromptAnswer(card, promptMode)}` : attempt.correct ? '✓ Correct Answer!' : `✕ Incorrect. Expected: ${getKanjiPromptAnswer(card, promptMode)}`}
              </div>
            )}

            {!attempt && !usedHint && (
              <button
                type="button"
                onClick={() => setUsedHint(true)}
                className="mt-2.5 font-mono text-[10px] font-black uppercase text-neutral-500 underline underline-offset-2 hover:text-black"
              >
                Show hint?
              </button>
            )}

            {usedHint && !attempt && (
              <div className="mt-2 border-2 border-black bg-[#FFDE59] p-2.5 font-mono text-xs font-black text-black shadow-[2px_2px_0px_0px_#000000]">
                {getKanjiHint(card, promptMode) || 'No hint available for this card.'}
              </div>
            )}
          </div>

          {(isRevealed || attempt) && (
            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase text-neutral-500">
                    // Reading (Kana / Romaji)
                  </span>
                  <p className="jp-font mt-1 text-xl font-black text-black">
                    {card.reading}
                  </p>
                  <p className="font-mono text-xs font-bold uppercase text-neutral-600">
                    {card.romaji}
                  </p>
                </div>

                <div className="border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase text-neutral-500">
                    // Meaning
                  </span>
                  <p className="mt-1 text-xl font-black text-black capitalize">
                    {card.meaning}
                  </p>
                </div>
              </div>

              {card.example && (
                <div className="border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase text-neutral-500">
                    // Example Usage
                  </span>
                  <p className="jp-font mt-1 text-base font-bold text-black">
                    {card.example[0]}
                  </p>
                  <p className="font-mono text-xs font-semibold text-neutral-600">
                    {card.example[1]}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Navigation Bar */}
      {!isLoading && !error && isLearning && card && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => moveCard(-1)}
            disabled={cardIndex === 0}
            className="flex h-11 items-center gap-1.5 border-2 border-black bg-white px-6 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            onClick={advanceCard}
            disabled={Boolean(attempt && !confidence)}
            className="flex h-11 items-center gap-1.5 border-2 border-black bg-[#A3E636] px-8 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{cardIndex === activeCards.length - 1 ? 'Review' : 'Next'}</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 5. Retry Bar */}
      {!isLoading && !error && isLearning && retryCards.length > 0 && !isRetryMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-[#FF6B6B] p-3.5 shadow-[4px_4px_0px_0px_#000000]">
          <p className="font-mono text-xs font-black uppercase text-black">
            {retryCards.length} card{retryCards.length === 1 ? '' : 's'} flagged for review
          </p>
          <button
            type="button"
            onClick={startRetry}
            className="border-2 border-black bg-white px-3.5 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            Review Flagged →
          </button>
        </div>
      )}
    </main>
  );
}

export default KanjiStudy;