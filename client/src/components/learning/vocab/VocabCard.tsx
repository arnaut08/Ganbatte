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

  // Match ONLY Kanji followed by [reading]
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
        {/* Furigana Badge (Clearly readable, centered directly above the Kanji) */}
        <span
          className="pointer-events-none absolute bottom-[calc(100%+4px)] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded border-2 border-black bg-white px-1.5 py-0.5 font-mono text-xs font-black leading-none text-black opacity-0 shadow-[2px_2px_0px_0px_#000000] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 group-active:opacity-100"
          aria-hidden="true"
        >
          {reading}
        </span>

        {/* Highlighted Yellow Kanji Block */}
        <span className="border-b-2 border-black bg-[#FFDE59] px-1 py-0.5 font-black text-black">
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
  onRate: (rating: 1 | 2 | 3 | 4) => void;
};

const ratings = [
  { value: 1, label: 'Again', icon: ExclamationTriangleIcon, className: 'bg-[#FF6B6B] hover:bg-[#ff8585]' },
  { value: 2, label: 'Hard', icon: LightningBoltIcon, className: 'bg-[#FFDE59] hover:bg-[#ffe77f]' },
  { value: 3, label: 'Good', icon: CheckCircledIcon, className: 'bg-[#70CFF8] hover:bg-[#8bd9fa]' },
  { value: 4, label: 'Easy', icon: ThickArrowRightIcon, className: 'bg-[#A3E636] hover:bg-[#b5eb5b]' },
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

export default function VocabCard({ vocab, onRate }: VocabCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
  }, [vocab.kanji, vocab.kana]);

  const level = vocab.jlpt_level || 'N5';
  const metadata = vocab.metadata || {};
  const isKanaOnly = vocab.kanji === vocab.kana;

  return (
    <div className="grid w-full grid-cols-1 [perspective:1200px]">
      {/* FRONT FACE (Yellow #FFDE59) */}
      <section
        style={{ gridArea: '1 / 1' }}
        className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#FFDE59] p-4 text-black shadow-[4px_4px_0px_0px_#000000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000000] ${isRevealed
            ? 'pointer-events-none opacity-0 [transform:rotateY(180deg)]'
            : 'z-10 opacity-100 [transform:rotateY(0deg)]'
          }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5 sm:pb-3">
          <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:px-2.5 sm:text-[10px]">
            JLPT {level}
          </span>
          <span className="border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:px-2.5 sm:text-[10px]">
            {formatLabel(vocab.pos)}
          </span>
        </div>

        {/* MAIN PROMPT */}
        <div className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-black/60 sm:text-[10px]">
            STAGE {String(vocab.stage_number).padStart(2, '0')} // {vocab.theme}
          </span>

          <h2 className="jp-font mt-2 text-4xl font-black leading-tight text-black sm:mt-4 sm:text-6xl">
            {renderBracketFurigana(vocab.furigana || vocab.kanji)}
          </h2>

          {!isKanaOnly && vocab.kana && (
            <p className="mt-2 font-mono text-base font-black uppercase tracking-wider text-black/80 sm:mt-3 sm:text-lg">
              {vocab.kana}
            </p>
          )}

          {vocab.romaji && (
            <p className="mt-1 font-mono text-xs font-bold text-black/60 sm:text-sm">
              {vocab.romaji}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col gap-2.5 border-t-2 border-black pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
          <div className="min-h-[26px]">
            {(metadata.transitivity || metadata.verb_group) && (
              <span className="inline-block border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000000] sm:text-[10px]">
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
            className="w-full border-2 border-black bg-black py-2.5 font-mono text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:w-auto sm:px-6 sm:py-2.5"
          >
            REVEAL ANSWER →
          </button>
        </div>
      </section>

      {/* BACK FACE (Cyan #70CFF8) */}
      <section
        style={{ gridArea: '1 / 1' }}
        className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#70CFF8] p-3.5 text-black shadow-[4px_4px_0px_0px_#000000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000000] ${!isRevealed
            ? 'pointer-events-none opacity-0 [transform:rotateY(-180deg)]'
            : 'z-10 opacity-100 [transform:rotateY(0deg)]'
          }`}
      >
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2 sm:pb-2.5">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider sm:text-xs">
            ANSWER // {vocab.kana}
          </span>
          <button
            type="button"
            onClick={() => speak(vocab.kana)}
            className="flex items-center gap-1 border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:px-2.5 sm:py-1 sm:text-[10px]"
          >
            <SpeakerLoudIcon className="h-3 w-3 text-black" aria-hidden="true" />
            <span>AUDIO</span>
          </button>
        </div>

        {/* MAIN WORD & MEANING */}
        <div className="my-auto py-2">
          <h2 className="jp-font text-2xl font-black text-black sm:text-3xl">
            {renderBracketFurigana(vocab.furigana || vocab.kanji)}
          </h2>

          {/* MEANING BOX */}
          <div className="mt-2.5 border-2 border-black bg-white p-3 text-left shadow-[2px_2px_0px_0px_#000000] sm:p-3.5">
            <span className="block font-mono text-[8px] font-black uppercase text-neutral-500 sm:text-[9px]">
              MEANING
            </span>
            <p className="mt-0.5 text-sm font-black text-black sm:text-lg">
              {vocab.english.join(' / ')}
            </p>
          </div>

          {/* EXAMPLES */}
          {vocab.examples?.length > 0 && (
            <div className="mt-3 space-y-2.5 text-left">
              <span className="block font-mono text-[8px] font-black uppercase text-black/70 sm:text-[9px]">
                EXAMPLES
              </span>
              {vocab.examples.slice(0, 2).map((example: any, index: number) => (
                <div
                  key={`${example.ja}-${index}`}
                  className="border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000000] sm:p-3"
                >
                  <p className="jp-font text-xs font-black leading-relaxed text-black sm:text-sm">
                    {renderBracketFurigana(example.furigana || example.ja)}
                  </p>
                  <p className="mt-1.5 text-[11px] font-bold leading-normal text-neutral-800 sm:text-xs">
                    {example.en}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SRS RATING CONTROLS */}
        <div className="mt-2 border-t-2 border-black pt-2.5 sm:pt-3">
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
                  className={`flex h-8 items-center justify-center gap-1 border-2 border-black px-1 font-mono text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:h-9 sm:text-[10px] ${rating.className}`}
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