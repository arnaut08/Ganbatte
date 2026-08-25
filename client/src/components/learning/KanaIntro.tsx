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
    <main className="container mx-auto max-w-4xl px-4 py-6 pb-24">
      {/* 1. Screen Header Lockup */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          title="Back to learning"
        >
          <span className="font-mono text-lg font-black">&lt;</span>
        </button>
        <div className="flex flex-col justify-center">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // PRACTICE: KANA DECK
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight sm:text-3xl">
            Active Kana Recall
          </h1>
        </div>
      </div>

      {/* 2. Main Hero Panel */}
      <section className="border-2 border-black bg-[#70CFF8] p-6 text-black shadow-[6px_6px_0px_0px_#000000] sm:p-8">
        {/* Intro Section Header */}
        <div className="space-y-2">
          <p className="font-mono text-xs font-black uppercase tracking-wider text-black">
            // STUDY SETUP
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
            Make Kana stick.
          </h2>
          <p className="max-w-3xl text-sm font-bold leading-relaxed text-black/90 sm:text-base">
            Select the Kana characters you want to practice, then recall each one from memory. Type the romaji reading, check your answer, and rate how confident you feel. Your confidence ratings stay attached to each character.
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 h-[2px] w-full bg-black" />

        {/* 3 Steps Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black">
              HOW IT WORKS: 3 EASY STEPS
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['01', 'Choose', 'Pick the characters you want to practice.'],
              ['02', 'Recall', 'Type the reading before revealing the answer.'],
              ['03', 'Rate', 'Mark Again, Hard, or Easy to shape your next session.'],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="flex flex-col justify-between border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_#000000]"
              >
                <div>
                  <span className="font-mono text-xs font-black text-[#FF6B6B]">{number}</span>
                  <h3 className="mt-1 font-mono text-sm font-black uppercase tracking-tight text-black">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-xs font-bold leading-relaxed text-black/80">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-[2px] w-full bg-black" />

        {/* Confidence Icons Legend */}
        <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_#000000]">
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-black">
            CONFIDENCE ICONS
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {CONFIDENCE_LEVELS.map(({ label, description, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_#000000]"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-5 w-5 text-black" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold text-black">
                  <strong className="font-black">{label}:</strong> {description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-[2px] w-full bg-black" />

        {/* 3. Bottom Action Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-2 sm:flex-row">
          <div className="text-center sm:text-left">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-black">
              READY TO PRACTICE?
            </span>
            <p className="text-xs font-bold text-black/80">
              Configure your deck and choose characters on the next screen.
            </p>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="flex h-12 w-full items-center justify-center gap-2 border-2 border-black bg-black px-8 font-mono text-sm font-black uppercase tracking-wider text-[#FFDE59] shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none sm:w-auto"
          >
            <span>Choose characters</span>
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </section>
    </main>
  );
}

export default KanaIntro;