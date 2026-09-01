import {
  SpeakerLoudIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
  CheckCircledIcon,
  ThickArrowRightIcon,
} from '@radix-ui/react-icons';
import { useEffect, useState, type ReactNode } from 'react';
import type { VocabItem } from '../../../types';

function renderBracketFurigana(text: string): ReactNode {
  const source = String(text || '');
  if (!source) return null;

  const pattern = /([\p{Script=Han}]+)\[([^\]]+)\]/gu;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match = pattern.exec(source);

  while (match) {
    if (match.index > lastIndex) {
      nodes.push(source.slice(lastIndex, match.index));
    }

    const kanji = match[1];
    const reading = match[2];

    nodes.push(
      <span
        key={`${match.index}-${kanji}`}
        className="group relative mx-0.5 inline-block cursor-pointer align-baseline focus:outline-none"
        tabIndex={0}
      >
        <span
          className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded border-2 border-black bg-white px-1.5 py-0.5 font-mono text-xs font-black leading-none text-black opacity-0 shadow-[2px_2px_0px_0px_#000] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100"
          aria-hidden="true"
        >
          {reading}
        </span>

        <span className="border-b-2 border-black bg-[#A3E636] px-1 py-0.5 font-black text-black">
          {kanji}
        </span>
      </span>
    );

    lastIndex = match.index + match[0].length;
    match = pattern.exec(source);
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return <>{nodes}</>;
}

type VocabCardProps = {
  vocab: VocabItem;
  position?: number;
  total?: number;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
};

const ratings = [
  { value: 1, label: 'AGAIN', icon: ExclamationTriangleIcon, className: 'bg-[#FF6B6B] text-black hover:bg-[#ff8585]' },
  { value: 2, label: 'HARD', icon: LightningBoltIcon, className: 'bg-[#FFDE59] text-black hover:bg-[#ffe77f]' },
  { value: 3, label: 'GOOD', icon: CheckCircledIcon, className: 'bg-[#70CFF8] text-black hover:bg-[#8bd9fa]' },
  { value: 4, label: 'EASY', icon: ThickArrowRightIcon, className: 'bg-white text-black hover:bg-neutral-100' },
] as const;

function formatLabel(value: string) {
  return value.replaceAll('_', ' ');
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  window.speechSynthesis.speak(utterance);
}

export default function VocabCard({ vocab, position, total, onRate }: VocabCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
  }, [vocab.kanji, vocab.kana]);

  const level = vocab.jlpt_level || 'N5';
  const metadata = vocab.metadata || {};
  const isKanaOnly = vocab.kanji === vocab.kana;

  return (
    <div className="grid w-full grid-cols-1 [perspective:1200px]">
      {/* FRONT OF CARD (DARK SLATE PROMPT) */}
      <section
        style={{ gridArea: '1 / 1' }}
        className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000] ${isRevealed
            ? 'pointer-events-none opacity-0 [transform:rotateY(180deg)]'
            : 'z-10 opacity-100 [transform:rotateY(0deg)]'
          }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-white/10 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-1.5">
            <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:text-[10px]">
              JLPT {level}
            </span>
            <span className="border-2 border-black bg-[#151922] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-neutral-300 shadow-[1px_1px_0px_0px_#000] sm:text-[10px]">
              {formatLabel(vocab.pos)}
            </span>
          </div>
          {position != null && total != null && (
            <span className="font-mono text-[10px] font-black uppercase text-neutral-400">
              {position} / {total}
            </span>
          )}
        </div>

        {/* MAIN WORD PROMPT STAGE */}
        <div className="my-3 flex flex-1 flex-col items-center justify-center border-2 border-black bg-[#151922] py-6 text-center shadow-[3px_3px_0px_0px_#000] sm:my-4 sm:py-8">
          <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#A3E636] sm:text-[10px]">
            STAGE {String(vocab.stage_number).padStart(2, '0')} // {vocab.theme}
          </span>

          <h2 className="jp-font mt-3 text-4xl font-black leading-tight text-white sm:mt-4 sm:text-6xl">
            {vocab.kanji}
          </h2>

          {!isKanaOnly && vocab.kana && (
            <p className="mt-2 font-mono text-base font-black uppercase tracking-wider text-neutral-300 sm:mt-3 sm:text-lg">
              {vocab.kana}
            </p>
          )}

          {vocab.romaji && (
            <p className="mt-1 font-mono text-xs font-bold text-neutral-400 sm:text-sm">
              {vocab.romaji}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2.5 border-t-2 border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
          <div className="min-h-[26px]">
            {(metadata.transitivity || metadata.verb_group) && (
              <span className="inline-block border-2 border-black bg-[#151922] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-neutral-300 shadow-[1px_1px_0px_0px_#000] sm:text-[10px]">
                {[metadata.transitivity, metadata.verb_group]
                  .filter(Boolean)
                  .map((t) => formatLabel(String(t)))
                  .join(' / ')}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsRevealed(true)}
            className="w-full cursor-pointer border-2 border-black bg-white py-2.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#A3E636] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto sm:px-6 sm:py-2.5"
          >
            REVEAL ANSWER →
          </button>
        </div>
      </section>

      {/* BACK OF CARD (NEO LIME ANSWER REVEAL) */}
      <section
        style={{ gridArea: '1 / 1' }}
        className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#A3E636] p-4 text-black shadow-[4px_4px_0px_0px_#000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000] ${!isRevealed
            ? 'pointer-events-none opacity-0 [transform:rotateY(-180deg)]'
            : 'z-10 opacity-100 [transform:rotateY(0deg)]'
          }`}
      >
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5 sm:pb-3">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-black sm:text-xs">
            ANSWER // {vocab.kana}
          </span>
          <button
            type="button"
            onClick={() => speak(vocab.kana)}
            className="flex cursor-pointer items-center gap-1 border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-2.5 sm:py-1 sm:text-[10px]"
          >
            <SpeakerLoudIcon className="h-3 w-3 text-black" aria-hidden="true" />
            <span>AUDIO</span>
          </button>
        </div>

        {/* MAIN WORD & MEANING BREAKDOWN */}
        <div className="my-auto py-2">
          <h2 className="jp-font text-2xl font-black text-black sm:text-3xl">
            {vocab.kanji}
          </h2>

          {/* MEANING BOX */}
          <div className="mt-2.5 border-2 border-black bg-white p-3 text-left shadow-[2px_2px_0px_0px_#000] sm:p-3.5">
            <span className="block font-mono text-[8px] font-black uppercase text-neutral-500 sm:text-[9px]">
              MEANING
            </span>
            <p className="mt-0.5 text-sm font-black text-black sm:text-lg">
              {vocab.english.join(' / ')}
            </p>
          </div>

          {/* EXAMPLES */}
          {vocab.examples?.length > 0 && (
            <div className="mt-2.5 space-y-2 text-left sm:mt-3 sm:space-y-2.5">
              <span className="block font-mono text-[8px] font-black uppercase text-black/70 sm:text-[9px]">
                EXAMPLES
              </span>
              {vocab.examples.slice(0, 2).map((example: any, index: number) => (
                <div
                  key={`${example.ja}-${index}`}
                  className="border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-3"
                >
                  <p className="jp-font text-xs font-black leading-relaxed text-black sm:text-sm">
                    {renderBracketFurigana(example.furigana || example.ja)}
                  </p>
                  <p className="mt-1 text-[11px] font-bold leading-normal text-neutral-800 sm:text-xs">
                    {example.en}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SRS RATING CONTROLS */}
        <div className="border-t-2 border-black pt-2.5 sm:pt-3">
          <span className="mb-1.5 block text-left font-mono text-[8px] font-black uppercase tracking-wider text-black sm:text-[9px]">
            RATE THIS RECALL
          </span>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
            {ratings.map((rating) => {
              const Icon = rating.icon;
              return (
                <button
                  key={rating.value}
                  type="button"
                  onClick={() => onRate(rating.value)}
                  className={`flex h-8.5 cursor-pointer items-center justify-center gap-1 border-2 border-black px-1 font-mono text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[0.5px_0.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-9.5 sm:text-[10px] ${rating.className}`}
                >
                  <Icon className="h-3 w-3 shrink-0 text-black" />
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