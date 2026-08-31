import { CheckIcon } from '@radix-ui/react-icons';

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
    <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]">
      {/* Scaled Kana Character to avoid badge collision */}
      <span className="kana-font text-xs sm:text-sm font-black text-black select-none">
        あ
      </span>

      {/* Badges anchored strictly in the outer corner */}
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
    <main className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 sm:py-8">
      {/* HEADER */}
      <header className="mb-4 flex items-center gap-2.5 sm:mb-6 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
          title="Back to learning"
          aria-label="Back to learning"
        >
          <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
        </button>
        <div className="flex flex-col justify-center text-left">
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-400 sm:text-xs">
            // PRACTICE: KANA CHARACTERS
          </span>
          <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            Hiragana &amp; Katakana Recall
          </h1>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <section className="border-2 border-black bg-[#FFDE59] p-3.5 text-black shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000]">
        <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black/80 sm:text-xs">
          // KANA RECALL
        </span>
        <h2 className="mt-0.5 text-2xl font-black uppercase tracking-tight sm:mt-1 sm:text-4xl">
          Master the foundational scripts.
        </h2>
        <p className="mt-1 font-mono text-xs font-bold leading-relaxed text-neutral-900 sm:mt-2 sm:text-sm">
          Select character sets, type the correct romaji readings from memory, and build automatic recall across all 46 basic characters, voiced variations, and combos.
        </p>

        <hr className="my-3.5 border-t-2 border-black sm:my-6" />

        {/* 3 STEPS */}
        <div className="space-y-1.5 sm:space-y-2">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider sm:text-xs">
            HOW IT WORKS: 3 EASY STEPS
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {KANA_STEPS.map(({ number, title, description, color }) => (
              <div
                key={number}
                className="border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4"
              >
                <span className="text-[11px] font-black sm:text-xs" style={{ color }}>
                  {number}
                </span>
                <h3 className="text-xs font-black uppercase tracking-wide sm:text-sm">
                  {title}
                </h3>
                <p className="mt-0.5 text-[10px] font-bold leading-snug text-neutral-700 sm:text-[11px]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* MASTERY STATUS LEGEND */}
        <div className="mt-3.5 border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:mt-6 sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-black sm:mb-3 sm:text-xs">
            MASTERY STATUS
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {MASTERY_LEVELS.map(({ label, description, streak }) => (
              <div key={label} className="flex items-center gap-2.5">
                <SampleTile streak={streak} />
                <div className="min-w-0">
                  <span className="block text-[10px] font-black leading-tight text-black sm:text-xs">
                    {label}
                  </span>
                  <span className="block text-[9px] font-bold text-neutral-600 sm:text-[10px]">
                    {description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CHARACTER SETS SCOPE */}
        <div className="mt-3 border-2 border-black bg-[#70CFF8] p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:mt-6 sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
          <span className="text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
            CHARACTER SETS SCOPE
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-2 sm:gap-2">
            {CHARACTER_SET_SCOPE.map(({ count, label }) => (
              <span
                key={label}
                className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-2.5 sm:py-1 sm:text-[11px]"
              >
                <strong className="font-black">{count}</strong> {label}
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] font-bold leading-relaxed text-neutral-900 sm:mt-2 sm:text-xs">
            Practice basic characters (46), voiced Dakuten/Handakuten (25), and combination sounds (33).
          </p>
        </div>

        {/* FOOTER ACTION */}
        <div className="mt-4 flex flex-col gap-2.5 border-t-2 border-black pt-3.5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
          <div>
            <span className="block font-mono text-[10px] font-black uppercase sm:text-xs">
              READY TO PRACTICE?
            </span>
            <span className="font-mono text-[9px] font-bold text-neutral-800 sm:text-[11px]">
              Configure your Kana study deck next.
            </span>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="flex w-full items-center justify-center gap-2 border-2 border-black bg-black py-2.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-neutral-800 hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto sm:px-6 sm:py-3 sm:shadow-[3px_3px_0px_0px_#000]"
          >
            CHOOSE CHARACTERS →
          </button>
        </div>
      </section>
    </main>
  );
}