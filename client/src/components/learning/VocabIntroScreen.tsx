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
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-8">
      {/* HEADER */}
      <header className="mb-6 flex items-center gap-3 sm:gap-4">
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
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-400">
            // PRACTICE: VOCABULARY DECK
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
            ACTIVE VOCAB RECALL
          </h1>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <section className="border-2 border-black bg-[#A3E636] p-6 text-black shadow-[6px_6px_0px_0px_#000000] sm:p-8">
        <span className="font-mono text-xs font-black uppercase tracking-wider text-black/80">
          // STUDY SETUP
        </span>
        <h2 className="mt-1 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          MAKE VOCAB STICK.
        </h2>
        <p className="mt-2 font-mono text-xs font-bold text-neutral-900 sm:text-sm">
          Select vocabulary stages, test your recall from memory, listen to pronunciation, and rate confidence to shape your review intervals.
        </p>

        <hr className="my-6 border-t-2 border-black" />

        {/* 3 STEPS */}
        <div className="space-y-2">
          <span className="font-mono text-xs font-black uppercase tracking-wider">
            HOW IT WORKS: 3 EASY STEPS
          </span>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* STEP 1 */}
            <div className="border-2 border-black bg-white p-4 font-mono shadow-[2px_2px_0px_0px_#000000]">
              <span className="text-xs font-black text-[#FF6B6B]">01</span>
              <h3 className="mt-1 text-sm font-black uppercase tracking-wide">CHOOSE</h3>
              <p className="mt-1 text-[11px] font-bold text-neutral-700">
                Pick a stage or filter by verbs, adjectives, and due reviews.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="border-2 border-black bg-white p-4 font-mono shadow-[2px_2px_0px_0px_#000000]">
              <span className="text-xs font-black text-[#FFDE59]">02</span>
              <h3 className="mt-1 text-sm font-black uppercase tracking-wide">RECALL</h3>
              <p className="mt-1 text-[11px] font-bold text-neutral-700">
                Recall reading & meaning before flipping to reveal audio and context sentences.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="border-2 border-black bg-white p-4 font-mono shadow-[2px_2px_0px_0px_#000000]">
              <span className="text-xs font-black text-[#70CFF8]">03</span>
              <h3 className="mt-1 text-sm font-black uppercase tracking-wide">RATE</h3>
              <p className="mt-1 text-[11px] font-bold text-neutral-700">
                Mark Again, Hard, Good, or Easy to calibrate your spaced repetition schedule.
              </p>
            </div>
          </div>
        </div>

        {/* CONFIDENCE ICONS */}
        <div className="mt-6 border-2 border-black bg-white p-4 font-mono shadow-[3px_3px_0px_0px_#000000]">
          <span className="mb-3 block text-xs font-black uppercase tracking-wider text-black">
            CONFIDENCE ICONS
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#FF6B6B]">
                <ExclamationTriangleIcon className="h-4 w-4 text-black" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Again: review soon</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#FFDE59]">
                <LightningBoltIcon className="h-4 w-4 text-black" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Hard: needs drill</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#70CFF8]">
                <CheckCircledIcon className="h-4 w-4 text-black" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Good: in memory</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#A3E636]">
                <ThickArrowRightIcon className="h-4 w-4 text-black" />
              </div>
              <span className="text-xs font-bold text-neutral-900">Easy: mastered</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex flex-col gap-3 border-t-2 border-black pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="block font-mono text-xs font-black uppercase">
              READY TO PRACTICE?
            </span>
            <span className="font-mono text-[11px] font-bold text-neutral-800">
              Configure stage and review vocabulary next.
            </span>
          </div>

          <button
            type="button"
            onClick={onStartLearning}
            className="flex items-center justify-center gap-2 border-2 border-black bg-black px-6 py-3 font-mono text-xs font-black uppercase text-white shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            CHOOSE STAGE →
          </button>
        </div>
      </section>
    </main>
  );
}