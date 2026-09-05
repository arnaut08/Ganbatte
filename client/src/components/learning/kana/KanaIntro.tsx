import { CheckIcon } from '@radix-ui/react-icons';
import GlobalPageHeader from '../../common/GlobalPageHeader';

type KanaIntroProps = {
  onBack: () => void;
  onContinue: () => void;
};

const KANA_STEPS = [
  {
    number: '01',
    title: 'SELECT',
    description:
      'Choose rows, columns, or full character groups from Hiragana and Katakana tables.',
    color: '#FF6B6B',
  },
  {
    number: '02',
    title: 'TYPE',
    description:
      'Type the matching romaji reading without looking at hints to lock in muscle memory.',
    color: '#70CFF8',
  },
  {
    number: '03',
    title: 'MASTER',
    description:
      'Hit 3 consecutive correct recalls per character to earn the permanent ★ MASTERED status.',
    color: '#A3E636',
  },
];

/** Visual mini-tile that mirrors the actual selection grid */
function SampleTile({ streak }: { streak: number }) {
  return (
    <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-black bg-[#151922] shadow-[2px_2px_0px_0px_#000]">
      <span className="kana-font text-xs sm:text-sm font-black text-white select-none">
        あ
      </span>

      {streak >= 3 ? (
        <span className="pointer-events-none absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center border border-black bg-[#A3E636] font-mono text-[8px] font-black leading-none text-black shadow-[1px_1px_0px_0px_#000]">
          ✓
        </span>
      ) : streak >= 1 ? (
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-black bg-[#70CFF8] shadow-[0.5px_0.5px_0px_0px_#000]" />
      ) : null}
    </div>
  );
}

const MASTERY_LEVELS = [
  {
    label: 'UNLEARNED (0/3)',
    description: 'Not practiced yet (Neutral tile).',
    streak: 0,
  },
  {
    label: 'PRACTICING (1–2/3)',
    description: 'Building streak (Cyan corner dot).',
    streak: 1,
  },
  {
    label: 'MASTERED (3/3)',
    description: 'Locked in (Lime Green checkmark).',
    streak: 3,
  },
];

const CHARACTER_SET_SCOPE = [
  { count: '46', label: 'Basic' },
  { count: '25', label: 'Dakuten' },
  { count: '33', label: 'Combos' },
];

export default function KanaIntro({ onBack, onContinue }: KanaIntroProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4 sm:py-8 pb-20 sm:pb-24">
      {/* HEADER */}
      <div className="mb-3 sm:mb-6">
        <GlobalPageHeader
          onBack={onBack}
          punchline="// PRACTICE: KANA CHARACTERS"
          title="Hiragana &amp; Katakana Recall"
          accentClass="text-[#FFDE59]"
        />
      </div>

      {/* MAIN CONTAINER */}
      <section className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-3.5 sm:p-7 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] space-y-3 sm:space-y-5">
        <div>
          <span className="border-2 border-black bg-[#FFDE59] px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]">
            01 // KANA RECALL
          </span>
          <h2 className="mt-1.5 text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Master the foundational scripts.
          </h2>
          <p className="mt-1 font-mono text-xs sm:text-sm font-medium leading-relaxed text-neutral-300">
            Select character sets, type the correct romaji readings from memory, and build automatic recall across all 46 basic characters, voiced variations, and combos.
          </p>
        </div>

        {/* 3 STEPS: Compact on Mobile, 3-Col on Desktop */}
        <div className="space-y-1.5 sm:space-y-2">
          <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-400">
            HOW IT WORKS: 3 EASY STEPS
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {KANA_STEPS.map(({ number, title, description, color }) => (
              <div
                key={number}
                className="flex sm:flex-col items-start gap-2.5 sm:gap-0 border-2 border-black bg-[#151922] p-2.5 sm:p-4 font-mono shadow-[2px_2px_0px_0px_#000]"
              >
                <span
                  className="shrink-0 px-1.5 py-0.5 text-[9px] sm:text-xs font-black border border-black text-black"
                  style={{ backgroundColor: color }}
                >
                  {number}
                </span>
                <div className="min-w-0">
                  <h3 className="sm:mt-2 text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                    {title}
                  </h3>
                  <p className="mt-0.5 sm:mt-1 text-[11px] font-medium leading-snug text-neutral-300">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MASTERY STATUS LEGEND */}
        <div className="border-2 border-black bg-[#151922] p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
          <span className="mb-2 block text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-400">
            MASTERY STATUS
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {MASTERY_LEVELS.map(({ label, description, streak }) => (
              <div key={label} className="flex items-center gap-2.5">
                <SampleTile streak={streak} />
                <div className="min-w-0">
                  <span className="block text-[11px] sm:text-xs font-black leading-tight text-white">
                    {label}
                  </span>
                  <span className="block text-[10px] font-medium text-neutral-400 leading-snug">
                    {description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHARACTER SETS SCOPE */}
        <div className="border-2 border-black bg-[#151922] p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-400">
            CHARACTER SETS SCOPE
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5 sm:gap-2">
            {CHARACTER_SET_SCOPE.map(({ count, label }) => (
              <span
                key={label}
                className="border-2 border-black bg-[#1f2637] border-l-4 border-l-[#FFDE59] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000]"
              >
                <strong className="text-[#FFDE59] font-black">{count}</strong> {label}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] sm:text-xs font-medium leading-relaxed text-neutral-300">
            Practice basic characters (46), voiced Dakuten/Handakuten (25), and combination sounds (33).
          </p>
        </div>

        {/* FOOTER ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t-2 border-black/40 pt-3 sm:pt-4">
          <div>
            <span className="block font-mono text-[10px] sm:text-xs font-black uppercase text-white">
              READY TO PRACTICE?
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-medium text-neutral-400">
              Configure your Kana study deck next.
            </span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto cursor-pointer border-2 border-black bg-white px-5 py-2.5 sm:px-6 sm:py-3 font-mono text-xs font-black uppercase text-black shadow-[2.5px_2.5px_0px_0px_#000] hover:bg-[#FFDE59] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-center"
          >
            CHOOSE CHARACTERS →
          </button>
        </div>
      </section>
    </main>
  );
}