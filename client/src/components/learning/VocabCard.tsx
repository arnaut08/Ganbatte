import {
  SpeakerLoudIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
  CheckCircledIcon,
  ThickArrowRightIcon,
} from '@radix-ui/react-icons';
import { useEffect, useState, type ReactNode } from 'react';
import type { VocabItem } from '../../types';

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
      <ruby
        key={`${match.index}-${kanji}`}
        className="kanji-reading"
        tabIndex={0}
      >
        <span>{kanji}</span>
        <rt>{reading}</rt>
      </ruby>
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
    <div className="w-full [perspective:1200px]">
      <div
        className={`relative w-full transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
          isRevealed ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* FRONT */}
        <section
          className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#FFDE59] p-5 text-black shadow-[6px_6px_0px_0px_#000000] [backface-visibility:hidden] sm:p-7 ${
            isRevealed ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-3">
            <span className="border-2 border-black bg-[#A3E636] px-2 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000000]">
              JLPT {level}
            </span>
            <span className="border-2 border-black bg-white px-2 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000000]">
              {formatLabel(vocab.pos)}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/60">
              Stage {vocab.stage_number} // {vocab.theme}
            </span>
            <h2 className="jp-font mt-4 text-5xl font-black leading-tight sm:text-7xl">
              {renderBracketFurigana(vocab.furigana || vocab.kanji)}
            </h2>
            {!isKanaOnly && (
              <p className="mt-3 font-mono text-lg font-black uppercase tracking-wider text-black/80">
                {vocab.kana}
              </p>
            )}
            {vocab.romaji && (
              <p className="mt-1 font-mono text-sm font-bold text-black/60">{vocab.romaji}</p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-black pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {(metadata.transitivity || metadata.verb_group) && (
                <span className="border-2 border-black bg-white px-2 py-2 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000000]">
                  {[metadata.transitivity, metadata.verb_group].filter(Boolean).map((t) => formatLabel(String(t))).join(' / ')}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsRevealed(true)}
              className="border-2 border-black bg-black px-5 py-2.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_#000000] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Reveal Answer
            </button>
          </div>
        </section>

        {/* BACK */}
        <section
          className={`absolute inset-0 flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#70CFF8] p-5 text-black shadow-[6px_6px_0px_0px_#000000] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-7 ${
            !isRevealed ? 'pointer-events-none' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-2">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider">
              Answer // {vocab.kana}
            </span>
            <button
              type="button"
              onClick={() => speak(vocab.kana)}
              className="flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <SpeakerLoudIcon className="h-4 w-4" aria-hidden="true" /> Audio
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center py-2">
            <h2 className="jp-font text-2xl font-black sm:text-3xl">
              {renderBracketFurigana(vocab.furigana || vocab.kanji)}
            </h2>
            <div className="mt-2 border-2 border-black bg-white p-2.5 shadow-[2px_2px_0px_0px_#000000]">
              <span className="font-mono text-[9px] font-black uppercase text-neutral-500">Meaning</span>
              <p className="text-base font-black leading-tight sm:text-lg">{vocab.english.join(' / ')}</p>
            </div>
            <div className="mt-2 space-y-1.5">
              <span className="font-mono text-[9px] font-black uppercase">Examples</span>
              {vocab.examples.slice(0, 2).map((example, index) => (
                <div key={`${example.ja}-${index}`} className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000000]">
                  <p className="jp-font text-sm font-black sm:text-base">
                    {renderBracketFurigana(example.furigana || example.ja)}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-neutral-700">{example.en}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t-2 border-black pt-3">
            <span className="mb-1.5 block font-mono text-[10px] font-black uppercase">Rate this recall</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ratings.map((rating) => {
                const Icon = rating.icon;
                return (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() => onRate(rating.value)}
                    className={`flex items-center justify-center gap-1.5 border-2 border-black px-2 py-2 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${rating.className}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-black" />
                    {rating.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}