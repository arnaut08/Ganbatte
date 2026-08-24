import { ChevronRightIcon } from '@radix-ui/react-icons';
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
} from '@radix-ui/react-icons';

const CONFIDENCE_LEVELS = [
  { label: 'Again', description: 'Review soon', icon: ExclamationTriangleIcon, color: '#FFDE59' },
  { label: 'Hard', description: 'Needs practice', icon: LightningBoltIcon, color: '#FF6B6B' },
  { label: 'Easy', description: 'Felt easy', icon: CheckCircledIcon, color: '#A3E636' },
];

function KanaIntro({ onBack, onContinue }) {
  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6 pb-28">
      <button
        type="button"
        onClick={onBack}
        className="flex h-11 w-11 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        title="Back to learning"
      >
        <span className="font-mono text-lg font-black">&lt;</span>
      </button>

      <section className="border-2 border-black bg-[#70CFF8] p-6 text-black shadow-[6px_6px_0px_0px_#000000] sm:p-10">
        <div className="border-b-2 border-black pb-5">
          <span className="border-2 border-black bg-black px-2.5 py-1 font-mono text-xs font-black uppercase tracking-wider text-[#70CFF8]">
            01 // Active Kana Recall
          </span>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight leading-none sm:text-5xl">
            Make Kana stick.
          </h1>
          <p className="mt-4 max-w-2xl text-base font-bold leading-relaxed">
            Select the Kana characters you want to practice, then recall each one from memory. Type the romaji reading, check your answer, and rate how confident you feel. Your confidence ratings stay attached to each character.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['01', 'Choose', 'Pick the characters you want to practice.'],
            ['02', 'Recall', 'Type the reading before revealing the answer.'],
            ['03', 'Rate', 'Mark Again, Hard, or Easy to shape your next session.'],
          ].map(([number, title, description]) => (
            <div key={number} className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
              <span className="font-mono text-xs font-black text-[#FF6B6B]">{number}</span>
              <h2 className="mt-2 font-mono text-sm font-black uppercase">{title}</h2>
              <p className="mt-1 text-xs font-bold leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
          <h2 className="font-mono text-xs font-black uppercase">Confidence icons</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {CONFIDENCE_LEVELS.map(({ label, description, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center border-2 border-black" style={{ backgroundColor: color }}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs font-bold">{label}: {description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t-2 border-black pt-5">
          <button
            type="button"
            onClick={onContinue}
            className="flex items-center gap-2 border-2 border-black bg-black px-6 py-3 font-mono text-sm font-black uppercase text-[#FFDE59] shadow-[4px_4px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            Choose characters
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}

export default KanaIntro;