import {
  ExclamationTriangleIcon,
  LightningBoltIcon,
  CheckCircledIcon,
  ThickArrowRightIcon,
} from '@radix-ui/react-icons';

type VocabIntroScreenProps = {
  onBack: () => void;
  onStartLearning: () => void;
};

export default function VocabIntroScreen({
  onBack,
  onStartLearning,
}: VocabIntroScreenProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 sm:py-8">
      {/* HEADER */}
      <header className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000000]"
          title="Back to learning"
          aria-label="Back to learning"
        >
          <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
        </button>
        <div>
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-400 sm:text-xs">
            // PRACTICE: VOCABULARY DECK
          </span>
          <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
            ACTIVE VOCAB RECALL
          </h1>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <section className="border-2 border-black bg-[#A3E636] p-4 text-black shadow-[4px_4px_0px_0px_#000000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000000]">
        <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black/80 sm:text-xs">
          // STUDY SETUP
        </span>
        <h2 className="mt-0.5 text-2xl font-black uppercase tracking-tight sm:mt-1 sm:text-4xl">
          MAKE VOCAB STICK.
        </h2>
        <p className="mt-1.5 font-mono text-xs font-bold leading-relaxed text-neutral-900 sm:mt-2 sm:text-sm">
          Select stages, test recall from memory, listen to pronunciation, and rate confidence to shape your SRS review schedule.
        </p>

        <hr className="my-4 border-t-2 border-black sm:my-6" />

        {/* 3 STEPS */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider sm:text-xs">
            HOW IT WORKS: 3 EASY STEPS
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {/* STEP 1 */}
            <div className="border-2 border-black bg-white p-3 font-mono shadow-[2px_2px_0px_0px_#000000] sm:p-4">
              <span className="text-[11px] font-black text-[#FF6B6B] sm:text-xs">01</span>
              <h3 className="text-xs font-black uppercase tracking-wide sm:text-sm">CHOOSE</h3>
              <p className="mt-0.5 text-[10px] font-bold text-neutral-700 sm:text-[11px]">
                Pick a stage or filter by verbs, adjectives, and reviews due.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="border-2 border-black bg-white p-3 font-mono shadow-[2px_2px_0px_0px_#000000] sm:p-4">
              <span className="text-[11px] font-black text-[#FFDE59] sm:text-xs">02</span>
              <h3 className="text-xs font-black uppercase tracking-wide sm:text-sm">RECALL</h3>
              <p className="mt-0.5 text-[10px] font-bold text-neutral-700 sm:text-[11px]">
                Recall reading & meaning before flipping to reveal audio and examples.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="border-2 border-black bg-white p-3 font-mono shadow-[2px_2px_0px_0px_#000000] sm:p-4">
              <span className="text-[11px] font-black text-[#70CFF8] sm:text-xs">03</span>
              <h3 className="text-xs font-black uppercase tracking-wide sm:text-sm">RATE</h3>
              <p className="mt-0.5 text-[10px] font-bold text-neutral-700 sm:text-[11px]">
                Mark Again, Hard, Good, or Easy to tune review intervals.
              </p>
            </div>
          </div>
        </div>

        {/* CONFIDENCE ICONS (2x2 Grid on Mobile, 4-col on Desktop) */}
        <div className="mt-4 border-2 border-black bg-white p-3 font-mono shadow-[2px_2px_0px_0px_#000000] sm:mt-6 sm:p-4 sm:shadow-[3px_3px_0px_0px_#000000]">
          <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-black sm:mb-3 sm:text-xs">
            SRS CONFIDENCE RATINGS
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-[#FF6B6B] sm:h-8 sm:w-8">
                <ExclamationTriangleIcon className="h-3.5 w-3.5 text-black" />
              </div>
              <span className="text-[10px] font-bold text-neutral-900 sm:text-xs">Again: soon</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-[#FFDE59] sm:h-8 sm:w-8">
                <LightningBoltIcon className="h-3.5 w-3.5 text-black" />
              </div>
              <span className="text-[10px] font-bold text-neutral-900 sm:text-xs">Hard: drill</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-[#70CFF8] sm:h-8 sm:w-8">
                <CheckCircledIcon className="h-3.5 w-3.5 text-black" />
              </div>
              <span className="text-[10px] font-bold text-neutral-900 sm:text-xs">Good: remembered</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-[#A3E636] sm:h-8 sm:w-8">
                <ThickArrowRightIcon className="h-3.5 w-3.5 text-black" />
              </div>
              <span className="text-[10px] font-bold text-neutral-900 sm:text-xs">Easy: mastered</span>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="mt-5 flex flex-col gap-3 border-t-2 border-black pt-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
          <div>
            <span className="block font-mono text-[11px] font-black uppercase sm:text-xs">
              READY TO PRACTICE?
            </span>
            <span className="font-mono text-[10px] font-bold text-neutral-800 sm:text-[11px]">
              Configure stage and review vocabulary next.
            </span>
          </div>

          <button
            type="button"
            onClick={onStartLearning}
            className="flex w-full items-center justify-center gap-2 border-2 border-black bg-black py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_0px_#000000] transition-all transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto sm:px-6"
          >
            CHOOSE STAGE →
          </button>
        </div>
      </section>
    </main>
  );
}