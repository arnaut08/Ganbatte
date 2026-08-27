import { ChevronRightIcon } from '@radix-ui/react-icons';
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons';

const CONFIDENCE_LEVELS = [
  { label: 'Again', description: 'review soon', icon: ExclamationTriangleIcon, color: '#FFDE59' },
  { label: 'Hard', description: 'needs practice', icon: LightningBoltIcon, color: '#FF6B6B' },
  { label: 'Easy', description: 'felt easy', icon: CheckCircledIcon, color: '#A3E636' },
];

type KanaIntroProps = {
  onBack: () => void;
  onContinue: () => void;
};

function KanaIntro({ onBack, onContinue }: KanaIntroProps) {
  return (
    <main className="container mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 pb-20 sm:pb-24">
      {/* 1. Screen Header Lockup */}
      <div className="mb-3.5 sm:mb-6 flex items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to learning"
        >
          <span className="font-mono text-base sm:text-lg font-black">&lt;</span>
        </button>
        <div className="flex flex-col justify-center">
          <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // PRACTICE: KANA DECK
          </span>
          <h1 className="text-lg font-black uppercase tracking-tight text-white leading-tight sm:text-3xl">
            Active Kana Recall
          </h1>
        </div>
      </div>

      {/* 2. Main Hero Panel */}
      <section className="border-2 border-black bg-[#70CFF8] p-4 text-black shadow-[3px_3px_0px_0px_#000000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000000]">
        {/* Intro Section Header */}
        <div className="space-y-1 sm:space-y-2">
          <p className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black">
        // STUDY SETUP
          </p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black sm:text-4xl">
            Make Kana stick.
          </h2>
          <p className="max-w-3xl text-xs font-bold leading-snug text-black/90 sm:text-base sm:leading-relaxed">
            Select Kana characters, recall them from memory, type the romaji reading, and rate confidence to shape your review sessions.
          </p>
        </div>

        {/* Divider */}
        <div className="my-3.5 sm:my-6 h-[2px] w-full bg-black" />

        {/* 3 Steps Section */}
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black">
              HOW IT WORKS: 3 EASY STEPS
            </span>
          </div>

          <div className="grid gap-2 sm:gap-4 sm:grid-cols-3">
            {[
              ['01', 'Choose', 'Pick characters to practice.'],
              ['02', 'Recall', 'Type reading before revealing answer.'],
              ['03', 'Rate', 'Mark Again, Hard, or Easy.'],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="flex items-center sm:items-start gap-3 sm:flex-col sm:justify-between border-2 border-black bg-white p-2.5 sm:p-4 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]"
              >
                <span className="font-mono text-xs sm:text-xs font-black text-[#FF6B6B] shrink-0">
                  {number}
                </span>
                <div className="min-w-0">
                  <h3 className="font-mono text-xs sm:text-sm font-black uppercase tracking-tight text-black">
                    {title}
                  </h3>
                  <p className="text-[11px] sm:text-xs font-bold leading-tight text-black/80 sm:mt-1 sm:leading-relaxed truncate sm:whitespace-normal">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-3.5 sm:my-6 h-[2px] w-full bg-black" />

        {/* Confidence Icons Legend */}
        <div className="border-2 border-black bg-white p-3 sm:p-5 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
          <h3 className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black">
            CONFIDENCE ICONS
          </h3>
          <div className="mt-2.5 sm:mt-4 grid gap-2 sm:gap-3 sm:grid-cols-3">
            {CONFIDENCE_LEVELS.map(({ label, description, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2 sm:gap-3">
                <span
                  className="flex h-7 w-7 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-black" aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-black leading-tight">
                  <strong className="font-black">{label}:</strong> {description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-3.5 sm:my-6 h-[2px] w-full bg-black" />

        {/* 3. Bottom Action Bar */}
        <div className="flex flex-col items-center justify-between gap-3 pt-1 sm:flex-row sm:gap-4 sm:pt-2">
          <div className="text-center sm:text-left">
            <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black">
              READY TO PRACTICE?
            </span>
            <p className="text-[11px] sm:text-xs font-bold text-black/80 leading-tight">
              Configure deck and select characters next.
            </p>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="flex h-10 sm:h-12 w-full items-center justify-center gap-1.5 sm:gap-2 border-2 border-black bg-black px-5 sm:px-8 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-[#FFDE59] shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto"
          >
            <span>Choose characters</span>
            <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </section>
    </main>
  );
}

export default KanaIntro;