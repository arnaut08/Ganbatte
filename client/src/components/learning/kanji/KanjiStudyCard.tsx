import { useEffect, useState } from 'react';
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
  ThickArrowRightIcon,
} from '@radix-ui/react-icons';
import type { KanjiCard } from '../../../types';

export type KanjiStudyCardData = KanjiCard & {
  id: string;
  reading?: string;
  meaning?: string;
  example?: [string, string];
};
export type KanjiRating = 1 | 2 | 3 | 4;

type Props = {
  card: KanjiStudyCardData;
  groupName: string;
  position: number;
  total: number;
  saving: boolean;
  onRate: (rating: KanjiRating) => void;
};

const ratings: Array<{
  value: KanjiRating;
  label: string;
  icon: typeof ExclamationTriangleIcon;
  className: string;
}> = [
    {
      value: 1,
      label: 'AGAIN',
      icon: ExclamationTriangleIcon,
      className: 'bg-[#FF6B6B] text-black hover:bg-[#ff8585]',
    },
    {
      value: 2,
      label: 'HARD',
      icon: LightningBoltIcon,
      className: 'bg-[#FFDE59] text-black hover:bg-[#ffe77f]',
    },
    {
      value: 3,
      label: 'GOOD',
      icon: CheckCircledIcon,
      className: 'bg-white text-black hover:bg-neutral-100',
    },
    {
      value: 4,
      label: 'EASY',
      icon: ThickArrowRightIcon,
      className: 'bg-[#A3E636] text-black hover:bg-[#b5eb5b]',
    },
  ];

export default function KanjiStudyCard({
  card,
  groupName,
  position,
  total,
  saving,
  onRate,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [card.kanji, card.reading]);

  return (
    <div className="grid w-full grid-cols-1 [perspective:1200px]">
      {/* FRONT OF CARD (DARK SLATE PROMPT) */}
      <section
        style={{ gridArea: '1 / 1' }}
        className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000] ${revealed
            ? 'pointer-events-none opacity-0 [transform:rotateY(180deg)]'
            : 'z-10 opacity-100 [transform:rotateY(0deg)]'
          }`}
      >
        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b-2 border-white/10 pb-2.5 sm:pb-3">
          <span className="shrink-0 border-2 border-black bg-[#70CFF8] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:text-[10px]">
            {groupName}
          </span>
          <span className="shrink-0 font-mono text-[10px] font-black uppercase text-neutral-400">
            {position} / {total}
          </span>
        </div>

        {/* Large Kanji Character Well */}
        <div className="my-3 flex flex-1 flex-col items-center justify-center border-2 border-black bg-[#151922] py-8 text-center shadow-[3px_3px_0px_0px_#000] sm:my-4 sm:py-10">
          <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#70CFF8] sm:text-[10px]">
            RECALL THE READING + MEANING
          </span>
          <h2 className="jp-font mt-4 text-8xl font-black leading-none text-white sm:text-[10rem]">
            {card.kanji}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-full cursor-pointer border-2 border-black bg-white py-3 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#70CFF8] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-sm"
        >
          Reveal answer →
        </button>
      </section>

      {/* BACK OF CARD (CYAN BLUE ANSWER REVEAL) */}
      <section
        style={{ gridArea: '1 / 1' }}
        className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#70CFF8] p-4 text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000] ${!revealed
            ? 'pointer-events-none opacity-0 [transform:rotateY(-180deg)]'
            : 'z-10 opacity-100 [transform:rotateY(0deg)]'
          }`}
      >
        {/* Header */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2.5 sm:pb-3">
          <span className="shrink-0 border-2 border-black bg-black px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#70CFF8] shadow-[1px_1px_0px_0px_#000] sm:text-[10px]">
            ANSWER // {groupName}
          </span>
          <span className="shrink-0 font-mono text-[10px] font-black uppercase text-black">
            {position} / {total}
          </span>
        </div>

        {/* Answer Breakdown Panels in High-Contrast White */}
        <div className="my-auto grid gap-2.5 py-2 text-left sm:grid-cols-2 sm:gap-3">
          <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000] sm:p-3.5">
            <span className="font-mono text-[9px] font-black uppercase tracking-wider text-neutral-500">
              READING
            </span>
            <p className="jp-font mt-1 text-lg font-black text-black sm:text-xl">{card.reading}</p>
            {card.romaji && (
              <p className="font-mono text-[10px] font-bold uppercase text-neutral-600 sm:text-xs">
                {card.romaji}
              </p>
            )}
          </div>

          <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000] sm:p-3.5">
            <span className="font-mono text-[9px] font-black uppercase tracking-wider text-neutral-500">
              MEANING
            </span>
            <p className="mt-1 text-lg font-black text-black sm:text-xl">{card.meaning}</p>
          </div>

          {card.example && (
            <div className="border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_#000] sm:col-span-2 sm:p-3.5">
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-neutral-500">
                EXAMPLE
              </span>
              <p className="jp-font mt-1 text-sm font-black text-black sm:text-base">
                {card.example[0]}
              </p>
              <p className="mt-0.5 font-mono text-[10px] font-bold text-neutral-700 sm:text-xs">
                {card.example[1]}
              </p>
            </div>
          )}
        </div>

        {/* SRS Rating Bar */}
        <div className="border-t-2 border-black pt-3 sm:pt-4">
          <span className="mb-2 block font-mono text-[9px] font-black uppercase tracking-wider text-black sm:text-[10px]">
            RATE THIS RECALL
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ratings.map((rating) => {
              const Icon = rating.icon;
              return (
                <button
                  key={rating.value}
                  type="button"
                  disabled={saving}
                  onClick={() => onRate(rating.value)}
                  className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 border-2 border-black font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-[11px] ${rating.className}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{rating.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}