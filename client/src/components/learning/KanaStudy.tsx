import { useEffect, useState } from 'react';
import { getKanaCards } from '../../services/api';
import type { KanaCard } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

type KanaStudyProps = {
  onBack: () => void;
  onOpenFilter: () => void;
  selectedKana?: Set<string>;
};

function KanaStudy({ onBack, onOpenFilter, selectedKana }: KanaStudyProps) {
  const [kanaData, setKanaData] = useState<{ cards: KanaCard[] }>({ cards: [] });
  const [cardIndex, setCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKanaCards()
      .then((data) => {
        setKanaData({
          cards: Array.isArray(data?.cards) ? data.cards : [],
        });
      })
      .catch(() => setError('Unable to load Kana cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  // Filter cards based on selected kana characters
  const cards =
    selectedKana && selectedKana.size > 0
      ? kanaData.cards.filter((card) => selectedKana.has(card.kana))
      : kanaData.cards;
  const card = cards[cardIndex];

  // Dynamic Theme Colors: Hiragana (#FFDE59 Yellow), Katakana (#70CFF8 Cyan)
  const isHiragana =
    card?.script === 'hiragana' ||
    card?.groupName?.toLowerCase().includes('hiragana');
  const accentColor = isHiragana ? '#FFDE59' : '#70CFF8';

  const moveCard = (direction: number) => {
    setCardIndex((current) => (current + direction + cards.length) % cards.length);
  };

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      {/* 1. Cohesive Screen Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            title="Back to previous screen"
          >
            <ChevronLeftIcon className="h-5 w-5 stroke-[2]" />
          </button>

          <div className="flex flex-col justify-center">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
              // PRACTICE: KANA DECK
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
              Syllabary Foundation
            </h1>
          </div>
        </div>

        {/* Filter Trigger Button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenFilter}
            className="border-2 border-black bg-[#A3E636] px-3.5 py-2 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Change kana selection"
          >
            {cards.length} KANA SELECTED ⚙
          </button>
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

      {/* 4. Empty State */}
      {!isLoading && !error && cards.length === 0 && (
        <div className="border-2 border-black bg-[#1a1f2c] p-12 text-center shadow-[6px_6px_0px_0px_#000000]">
          <p className="font-mono text-sm font-black uppercase text-neutral-400">
            No kana selected. Please go back and select kana to study.
          </p>
          <button
            type="button"
            onClick={onOpenFilter}
            className="mt-6 border-2 border-black bg-[#A3E636] px-6 py-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Select Kana →
          </button>
        </div>
      )}

      {/* 5. All-in-One Kana Card (No 'Show Reading' click needed) */}
      {!isLoading && !error && card && (
        <div
          className="relative flex flex-col justify-between overflow-hidden border-2 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000000] transition-all"
          style={{ backgroundColor: accentColor }}
        >
          {/* Card Header: Group & Counter */}
          <div className="flex items-center justify-between border-b-2 border-black pb-4">
            <span className="border-2 border-black bg-black px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider text-white">
              {card.groupName || 'Basic Kana'}
            </span>
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black">
              CARD {cardIndex + 1} OF {cards.length}
            </span>
          </div>

          {/* Main Visual & Info Section */}
          <div className="my-6 grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            {/* Hero Character Box */}
            <div className="flex flex-col items-center justify-center border-2 border-black bg-white p-6 shadow-[4px_4px_0px_0px_#000000]">
              <span className="kana-font select-none text-8xl sm:text-9xl font-black text-black leading-none">
                {card.kana}
              </span>
            </div>

            {/* Reading / Pronunciation Grid */}
            <div className="space-y-3">
              {/* Romaji */}
              <div className="border-2 border-black bg-white p-3.5 shadow-[3px_3px_0px_0px_#000000]">
                <span className="font-mono text-[10px] font-black uppercase text-neutral-500">
                  // Romaji
                </span>
                <p className="mt-0.5 font-mono text-2xl font-black uppercase tracking-wide text-black">
                  {card.romaji}
                </p>
              </div>

              {/* Mnemonic Text Box (If Provided) */}
              {card.mnemonic && (
                <div className="border-2 border-black bg-[#A3E636] p-3 shadow-[3px_3px_0px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase text-black">
                    💡 Mnemonic
                  </span>
                  <p className="mt-0.5 text-xs font-bold text-black leading-tight">
                    {card.mnemonic}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Example Word Section */}
          {card.example && (
            <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-neutral-500">
                // Example Vocabulary
              </span>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="jp-font text-xl font-black text-black">
                  {card.example[0]}
                </span>
                <span className="font-mono text-xs font-bold text-neutral-600">
                  ({card.example[1]})
                </span>
                <span className="text-sm font-semibold text-black">
                  — {card.example[2]}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Stepper Navigation */}
      {!isLoading && !error && card && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => moveCard(-1)}
            disabled={cardIndex === 0}
            className="flex h-11 items-center gap-1.5 border-2 border-black bg-white px-6 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon className="h-4 w-4 stroke-[2]" />
            <span>Prev</span>
          </button>

          <button
            type="button"
            onClick={() => moveCard(1)}
            disabled={cardIndex === cards.length - 1}
            className="flex h-11 items-center gap-1.5 border-2 border-black bg-[#A3E636] px-8 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRightIcon className="h-4 w-4 stroke-[2]" />
          </button>
        </div>
      )}
    </main>
  );
}

export default KanaStudy;