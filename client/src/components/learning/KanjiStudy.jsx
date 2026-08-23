import { useEffect, useState } from 'react';
import { getKanjiCards } from '../../services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

function KanjiStudy({ onBack }) {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [kanjiData, setKanjiData] = useState({ cards: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKanjiCards()
      .then(setKanjiData)
      .catch(() => setError('Unable to load Kanji cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const cards = selectedGroups.length === 0
    ? kanjiData.cards
    : kanjiData.cards.filter((card) => selectedGroups.includes(card.groupId));
  const card = cards[cardIndex];

  const selectGroup = (groupId) => {
    setSelectedGroups((current) => current.includes(groupId)
      ? current.filter((selected) => selected !== groupId)
      : [...current, groupId]);
    setCardIndex(0);
    setIsRevealed(false);
  };

  const moveCard = (direction) => {
    setCardIndex((current) => (current + direction + cards.length) % cards.length);
    setIsRevealed(false);
  };

  const filterSummary = selectedGroups.length === 0
    ? 'All kanji'
    : `${selectedGroups.length} groups selected`;

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* 1. Cohesive Screen Header & Aligned Filter Dropdown */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            title="Back to previous screen"
          >
            <span className="font-mono text-lg font-black">&lt;</span>
          </button>

          <div className="flex flex-col justify-center">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
          // PRACTICE: KANJI DECK
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
              Reading Foundation
            </h1>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="shrink-0">
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-11 items-center justify-between gap-3 border-2 border-black bg-white px-4 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                aria-label="Filter Kanji groups"
              >
                <span className="truncate max-w-[140px]">{filterSummary}</span>
                <ChevronDownIcon className="h-4 w-4 stroke-[3]" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56 border-2 border-black bg-[#1a1f2c] p-1.5 shadow-[5px_5px_0px_0px_#000000]"
              align="end"
            >
              {/* All Kanji Option */}
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
                }}
              >
                <span className="mr-2">{selectedGroups.length === 0 ? '✓' : ' '}</span>
                All kanji
              </DropdownMenuItem>

              <div className="my-1 border-t-2 border-black/40" />

              {/* Group Items */}
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
                      e.preventDefault(); // <--- Must be present
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

      {/* 4. Main Kanji Flashcard */}
      {!isLoading && !error && card && (
        <div className="relative border-2 border-black bg-[#FFDE59] p-6 shadow-[6px_6px_0px_0px_#000000] sm:p-8">
          {/* Group Theme Banner */}
          <div className="flex justify-center">
            <span className="border-2 border-black bg-black px-3 py-1 font-mono text-[11px] font-black uppercase tracking-wider text-[#FFDE59] shadow-[2px_2px_0px_0px_#ffffff]">
              {card.groupName}
            </span>
          </div>

          {/* Hero Kanji Display */}
          <div className="my-8 flex justify-center">
            <div className="kana-font select-none text-8xl font-black text-black sm:text-9xl tracking-normal leading-none">
              {card.kanji}
            </div>
          </div>

          {/* Revealed Solution Panel */}
          {isRevealed ? (
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Reading Box */}
                <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-neutral-500">
                // READING
                  </span>
                  <p className="jp-font mt-1 text-2xl font-black text-black">
                    {card.reading}
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold uppercase text-neutral-600">
                    {card.romaji}
                  </p>
                </div>

                {/* Meaning Box */}
                <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-neutral-500">
                // MEANING
                  </span>
                  <p className="mt-1 text-2xl font-black text-black capitalize">
                    {card.meaning}
                  </p>
                </div>
              </div>

              {/* Example Sentence Box */}
              {card.example && (
                <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000] space-y-1">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-neutral-500">
                // EXAMPLE USAGE
                  </span>
                  <p className="jp-font text-lg font-bold text-black leading-snug">
                    {card.example[0]}
                  </p>
                  <p className="font-mono text-xs font-bold text-neutral-600">
                    {card.example[1]}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Reveal Action Button */
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setIsRevealed(true)}
                className="border-2 border-black bg-white px-8 py-3.5 font-mono text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Show Reading →
              </button>
            </div>
          )}

          {/* Card Counter Footer */}
          <div className="mt-8 text-center">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black/70">
              CARD {cardIndex + 1} OF {cards.length}
            </span>
          </div>
        </div>
      )}

      {/* 5. Bottom Navigation Controls */}
      {!isLoading && !error && card && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => moveCard(-1)}
            disabled={cardIndex === 0}
            className="flex h-11 items-center gap-1.5 border-2 border-black bg-white px-5 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4 stroke-[3]" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            onClick={() => moveCard(1)}
            disabled={cardIndex === cards.length - 1}
            className="flex h-11 items-center gap-1.5 border-2 border-black bg-[#A3E636] px-6 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRightIcon className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
      )}
    </main>
  );
}

export default KanjiStudy;