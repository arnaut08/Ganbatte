import { useEffect, useRef, useState } from 'react';
import { getKanjiAttempts, getKanjiCards, recordKanjiAttempt, updateKanjiConfidenceBatch } from '../../services/api';
import {
  buildKanjiAttempt,
  getKanjiHint,
  getKanjiPromptAnswer,
  KANJI_PROMPT_MODES,
} from '../../utils/kanjiRecall';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircledIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons';

const CONFIDENCE_OPTIONS = [
  { level: 'again', label: 'Again', icon: ExclamationTriangleIcon, color: '#FFDE59' },
  { level: 'hard', label: 'Hard', icon: LightningBoltIcon, color: '#FF6B6B' },
  { level: 'easy', label: 'Easy', icon: CheckCircledIcon, color: '#A3E636' },
  { level: null, label: 'Unrated', icon: null, color: '#FFFFFF' },
];

const CONFIDENCE_FILTERS = [
  { key: 'again', label: 'Review again characters', description: 'Practice characters marked Again.' },
  { key: 'hard', label: 'Hard characters', description: 'Practice characters marked Hard.' },
  { key: 'unrated', label: 'Unrated characters', description: 'Practice characters without a confidence rating.' },
];

const CONFIDENCE_SCOPES = [
  { key: 'all', label: 'All Characters', description: 'Include every selected character.' },
  { key: 'skip-easy', label: 'Skip Easy Characters', description: 'Exclude Easy characters from this session.' },
];

function KanjiStudy({ onBack }) {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [confidenceScope, setConfidenceScope] = useState('all');
  const [confidenceLevelFilters, setConfidenceLevelFilters] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [promptMode, setPromptMode] = useState(KANJI_PROMPT_MODES.READING);
  const [answer, setAnswer] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [usedHint, setUsedHint] = useState(false);
  const [retryCards, setRetryCards] = useState([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [persistenceError, setPersistenceError] = useState('');
  const [confidenceByCharacter, setConfidenceByCharacter] = useState({});
  const [isLearning, setIsLearning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewChanges, setReviewChanges] = useState({});
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [kanjiData, setKanjiData] = useState({ cards: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getKanjiCards(), getKanjiAttempts()])
      .then(([cardsData, attemptsData]) => {
        setKanjiData(cardsData);
        const savedConfidence = (attemptsData?.attempts || []).reduce((current, savedAttempt) => {
          if (savedAttempt.character && savedAttempt.confidence) {
            current[savedAttempt.character] = savedAttempt.confidence;
          }
          return current;
        }, {});
        setConfidenceByCharacter(savedConfidence);
      })
      .catch(() => setError('Unable to load Kanji cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const groupFilteredCards = selectedGroups.length === 0
    ? kanjiData.cards
    : kanjiData.cards.filter((card) => selectedGroups.includes(card.groupId));
  const cards = groupFilteredCards.filter((kanjiCard) => {
    const savedConfidence = confidenceByCharacter[kanjiCard.kanji] || null;
    const matchesSelectedLevels = confidenceLevelFilters.length === 0 || confidenceLevelFilters.some((level) => (
      level === 'unrated' ? savedConfidence === null : savedConfidence === level
    ));
    return matchesSelectedLevels && (confidenceScope !== 'skip-easy' || savedConfidence !== 'easy');
  });
  const activeCards = isRetryMode ? retryCards : cards;
  const card = activeCards[cardIndex];

  const answerRef = useRef(null);
  const confidenceRef = useRef(null);

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

  const selectGroup = (groupId) => {
    setSelectedGroups((current) => current.includes(groupId)
      ? current.filter((selected) => selected !== groupId)
      : [...current, groupId]);
    setCardIndex(0);
    setIsRevealed(false);
    setIsRetryMode(false);
    setRetryCards([]);
  };

  const selectConfidenceFilter = (filterKey) => {
    if (filterKey === 'all' || filterKey === 'skip-easy') {
      setConfidenceScope(filterKey);
      if (filterKey === 'all') setConfidenceLevelFilters([]);
    } else {
      setConfidenceLevelFilters((current) => current.includes(filterKey)
        ? current.filter((selected) => selected !== filterKey)
        : [...current, filterKey]);
    }
    setCardIndex(0);
    setIsRevealed(false);
    setIsRetryMode(false);
    setRetryCards([]);
  };

  const moveCard = (direction) => {
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

  const submitAnswer = (event) => {
    event.preventDefault();
    if (!card || attempt || !answer.trim()) return;

    const nextAttempt = buildKanjiAttempt({
      card,
      promptMode,
      answer,
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

  const rateConfidence = (level) => {
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

  const moveReviewCard = (character, nextConfidence) => {
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
        setConfidenceByCharacter((current) => updates.reduce(
          (next, update) => ({ ...next, [update.character]: update.confidence }),
          current,
        ));
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

  const exitRetry = () => {
    setIsRetryMode(false);
    setRetryCards([]);
    setCardIndex(0);
  };

  const filterSummary = selectedGroups.length === 0
    ? 'All kanji'
    : `${selectedGroups.length} groups selected`;

  const confidenceOptions = CONFIDENCE_OPTIONS.slice(0, 3);
  const confidenceLevels = CONFIDENCE_OPTIONS;

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* 1. Unified Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
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

        {/* Study & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Segmented Mode Selector */}
          <div className="flex border-2 border-black bg-black p-0.5 shadow-[3px_3px_0px_0px_#000000]">
            {Object.entries(KANJI_PROMPT_MODES).map(([label, mode]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPromptMode(mode)}
                className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase transition-all ${promptMode === mode
                    ? 'bg-[#FFDE59] text-black'
                    : 'bg-transparent text-neutral-400 hover:text-white'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center justify-between gap-2.5 border-2 border-black bg-white px-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                aria-label="Filter Kanji groups"
              >
                <span className="truncate max-w-[130px]">{filterSummary}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 stroke-[2]" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56 border-2 border-black bg-[#1a1f2c] p-1.5 shadow-[5px_5px_0px_0px_#000000]"
              align="end"
            >
              <DropdownMenuItem
                className={`cursor-pointer px-3 py-2 font-mono text-xs font-black uppercase transition-all ${selectedGroups.length === 0
                    ? 'border border-black bg-[#FFDE59] text-black'
                    : 'text-white hover:bg-[#252c3d]'
                  }`}
                onSelect={(e) => {
                  e.preventDefault();
                  setSelectedGroups([]);
                  setCardIndex(0);
                  setIsRevealed(false);
                  setIsRetryMode(false);
                  setRetryCards([]);
                }}
              >
                <span className="mr-2 font-bold">{selectedGroups.length === 0 ? '✓' : ' '}</span>
                All kanji
              </DropdownMenuItem>

              <div className="my-1 border-t-2 border-black/40" />

              {kanjiData.groups.map((group) => {
                const isSelected = selectedGroups.includes(group.id);
                return (
                  <DropdownMenuItem
                    key={group.id}
                    className={`cursor-pointer px-3 py-2 font-mono text-xs font-black uppercase transition-all ${isSelected
                        ? 'border border-black bg-[#FFDE59] text-black'
                        : 'text-white hover:bg-[#252c3d]'
                      }`}
                    onSelect={(e) => {
                      e.preventDefault();
                      selectGroup(group.id);
                    }}
                  >
                    <span className="mr-2 font-bold">{isSelected ? '✓' : ' '}</span>
                    {group.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {!isLoading && !error && isReviewing && (
        <section className="space-y-5 border-2 border-black bg-[#FFDE59] p-5 text-black shadow-[6px_6px_0px_0px_#000000] sm:p-8">
          <div className="border-b-2 border-black pb-4">
            <span className="font-mono text-xs font-black uppercase tracking-wider">// SESSION REVIEW</span>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-tight">Sort your confidence</h2>
            <p className="mt-2 text-sm font-bold">Move any character that changed for you. Only moved characters will be updated.</p>
          </div>

          {reviewError && <div className="border-2 border-black bg-[#FF6B6B] p-3 font-mono text-xs font-black uppercase">{reviewError}</div>}

          <div className="grid gap-4 md:grid-cols-3">
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
                    if (character) moveReviewCard(character, level);
                  }}
                  className="min-h-40 border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]"
                >
                  <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                    <span className="flex h-8 w-8 items-center justify-center border-2 border-black" style={{ backgroundColor: color }}>
                      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : <span className="font-black">?</span>}
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

      {!isLoading && !error && !isLearning && !isReviewing && (
        <section className="space-y-5 border-2 border-black bg-[#FFDE59] p-6 text-black shadow-[6px_6px_0px_0px_#000000] sm:p-8">
          <div className="border-b-2 border-black pb-4">
            <span className="font-mono text-xs font-black uppercase tracking-wider">// STUDY SETUP</span>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-tight">Choose your Kanji mission</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold">
              Select the groups and recall mode, then start when you are ready. Your confidence ratings stay attached to each character.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(KANJI_PROMPT_MODES).map(([label, mode]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPromptMode(mode)}
                className={`border-2 border-black p-4 text-left font-mono shadow-[3px_3px_0px_0px_#000] ${promptMode === mode ? 'bg-[#A3E636] text-black' : 'bg-white hover:bg-neutral-100'}`}
              >
                <span className="block text-xs font-black uppercase">{label} mode</span>
                <span className="mt-1 block text-xs font-bold">
                  {mode === KANJI_PROMPT_MODES.READING ? 'Type the romaji reading for each Kanji.' : 'Type the English meaning for each Kanji.'}
                </span>
              </button>
            ))}
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-mono text-xs font-black uppercase">Session scope: choose one</h3>
              <span className="font-mono text-[10px] font-bold uppercase text-black/60">Single select</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {CONFIDENCE_SCOPES.map(({ key, label, description }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectConfidenceFilter(key)}
                  aria-pressed={confidenceScope === key}
                  className={`border-2 border-black p-3 text-left font-mono shadow-[3px_3px_0px_0px_#000] ${confidenceScope === key ? 'bg-[#70CFF8]' : 'bg-white hover:bg-neutral-100'}`}
                >
                  <span className="block text-xs font-black uppercase">{label}</span>
                  <span className="mt-1 block text-xs font-bold">{description}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-baseline justify-between gap-3">
              <h3 className="font-mono text-xs font-black uppercase">Practice levels: choose any</h3>
              <span className="font-mono text-[10px] font-bold uppercase text-black/60">Multi-select</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {CONFIDENCE_FILTERS.map(({ key, label, description }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectConfidenceFilter(key)}
                  aria-pressed={confidenceLevelFilters.includes(key)}
                  className={`border-2 border-black p-3 text-left font-mono shadow-[3px_3px_0px_0px_#000] ${confidenceLevelFilters.includes(key) ? 'bg-[#70CFF8]' : 'bg-white hover:bg-neutral-100'}`}
                >
                  <span className="block text-xs font-black uppercase">{label}</span>
                  <span className="mt-1 block text-xs font-bold">{description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000]">
            <h3 className="font-mono text-xs font-black uppercase">Confidence icons</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {confidenceOptions.map(({ level, label, icon: Icon, color }) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center border-2 border-black" style={{ backgroundColor: color }}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-bold">{label}: {level === 'again' ? 'review soon' : level === 'hard' ? 'needs practice' : 'felt easy'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black pt-4">
            <span className="font-mono text-xs font-black uppercase">{cards.length} cards selected</span>
            <button type="button" onClick={startLearning} disabled={cards.length === 0} className="border-2 border-black bg-black px-6 py-3 font-mono text-sm font-black uppercase text-[#FFDE59] shadow-[4px_4px_0px_0px_#000] disabled:cursor-not-allowed disabled:opacity-40">
              Start learning
            </button>
          </div>
        </section>
      )}

      {/* 2. Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center border-2 border-black bg-[#1a1f2c] py-20 shadow-[6px_6px_0px_0px_#000000]">
          <div className="h-4 w-32 bg-[#252c3d] animate-pulse mb-6" />
          <div className="h-28 w-28 bg-[#252c3d] animate-pulse mb-6" />
          <div className="h-10 w-36 bg-[#252c3d] animate-pulse" />
        </div>
      )}

      {/* 3. Error Banner */}
      {error && (
        <div className="border-2 border-black bg-[#FF6B6B] p-4 text-center font-mono text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000000]">
          {error}
        </div>
      )}

      {/* 4. Streamlined Main Kanji Flashcard */}
      {!isLoading && !error && isLearning && card && (
        <div className="relative border-2 border-black bg-[#FFDE59] p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000]">
          {/* Top Meta Bar */}
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <span className="border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FFDE59]">
              {card.groupName || 'N5 Kanji'}
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black">
              {isRetryMode ? 'RETRY' : 'CARD'} {cardIndex + 1} OF {activeCards.length}
            </span>
          </div>

          <div ref={confidenceRef} tabIndex="-1" className="mt-3 flex items-center justify-end gap-2 outline-none" aria-label="Confidence rating">
            <span className="mr-1 font-mono text-[10px] font-black uppercase text-black/70">Confidence</span>
            {confidenceOptions.map(({ level, label, icon: Icon, color }) => (
              <button
                key={level}
                type="button"
                onClick={() => rateConfidence(level)}
                disabled={!attempt}
                title={`${label}: ${level === 'again' ? 'review soon' : level === 'hard' ? 'needs practice' : 'felt easy'}`}
                aria-label={`${label} confidence`}
                className={`flex h-9 w-9 items-center justify-center border-2 border-black text-black shadow-[2px_2px_0px_0px_#000] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${confidence === level ? 'translate-x-[1px] translate-y-[1px] shadow-none ring-2 ring-black' : 'hover:translate-x-[1px] hover:translate-y-[1px]'}`}
                style={{ backgroundColor: color }}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </button>
            ))}
          </div>

          {/* Hero Kanji Visual Stage */}
          <div className="my-6 flex justify-center">
            <div className="flex h-36 w-36 items-center justify-center border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000] sm:h-44 sm:w-44">
              <span className="kana-font select-none text-7xl sm:text-8xl font-black text-black leading-none">
                {card.kanji}
              </span>
            </div>
          </div>

          {/* Input / Quiz Section */}
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
                className={`mt-2 border-2 border-black p-3 font-mono text-sm font-black shadow-[2px_2px_0px_0px_#000000] ${attempt.skipped ? 'bg-[#70CFF8] text-black' : attempt.correct ? 'bg-[#A3E636] text-black' : 'bg-[#FF6B6B] text-black'
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

          {/* Solution & Info Cards (Revealed Automatically on Check or Skip) */}
          {(isRevealed || attempt) && (
            <div className="mt-5 space-y-3">
              {/* Side-by-side Reading & Meaning */}
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

              {/* Example Usage */}
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

      {/* 5. Navigation Bar */}
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
            disabled={attempt && !confidence}
            className="flex h-11 items-center gap-1.5 border-2 border-black bg-[#A3E636] px-8 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{cardIndex === activeCards.length - 1 ? 'Review' : 'Next'}</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Retry Bar (If cards failed) */}
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