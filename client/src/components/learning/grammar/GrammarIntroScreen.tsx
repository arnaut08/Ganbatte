import {
  CheckCircledIcon,
  StarFilledIcon,
} from '@radix-ui/react-icons';

type GrammarIntroScreenProps = {
  onBack: () => void;
  onStartLearning: () => void;
};

const GRAMMAR_STEPS = [
  {
    number: '01',
    title: 'STUDY',
    description: 'Browse Genki Volume 1 lessons and inspect each grammatical pattern up close.',
    color: '#FF6B6B',
  },
  {
    number: '02',
    title: 'RECALL',
    description: 'Take a 10-question quiz on each lesson to lock patterns into active recall.',
    color: '#70CFF8',
  },
  {
    number: '03',
    title: 'MASTER',
    description: 'Score 100% or pass on 2 consecutive days to permanently master a lesson.',
    color: '#A3E636',
  },
];

const GRAMMAR_RATINGS = [
  {
    label: 'Cleared',
    requirement: 'Score ≥ 80%',
    description: 'Pass any practice quiz with 80% or higher.',
    icon: CheckCircledIcon,
    bgColor: 'bg-[#A3E636]',
  },
  {
    label: 'Mastered',
    requirement: '100% or 2 Consecutive Days (≥ 80%)',
    description: 'Achieve a perfect score or pass on 2 separate days.',
    icon: StarFilledIcon,
    bgColor: 'bg-[#C084FC]',
  },
];

export default function GrammarIntroScreen({ onBack, onStartLearning }: GrammarIntroScreenProps) {
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
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#C084FC] sm:text-xs">
            // PRACTICE: GRAMMAR
          </span>
          <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
            Genki Grammar Recall
          </h1>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <section className="border-2 border-black bg-[#C084FC] p-4 text-black shadow-[4px_4px_0px_0px_#000] sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]">
        <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black/75 sm:text-xs">
          // STUDY SETUP
        </span>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Master grammar patterns.
        </h2>
        <p className="mt-1.5 font-mono text-xs font-bold leading-relaxed text-neutral-900 sm:text-sm">
          Study Genki Volume 1 lessons, take recall quizzes, and clear lessons to unlock consecutive-day mastery and build long-term retention.
        </p>

        <hr className="my-4 border-t-2 border-black sm:my-5" />

        {/* 3 STEPS */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider sm:text-xs">
            HOW IT WORKS: 3 EASY STEPS
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {GRAMMAR_STEPS.map((step) => (
              <div
                key={step.number}
                className="flex flex-col justify-between border-2 border-black bg-white p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4"
              >
                <div>
                  <span
                    className="text-xs font-black sm:text-sm"
                    style={{ color: step.color }}
                  >
                    {step.number}
                  </span>
                  <h3 className="mt-0.5 text-xs font-black uppercase tracking-wide sm:text-sm">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-bold leading-snug text-neutral-700 sm:text-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LESSON OUTCOME LEGENDS */}
        <div className="mt-4 border-2 border-black bg-white p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:mt-5 sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
          <span className="mb-2.5 block text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
            LESSON OUTCOME LEGENDS
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            {GRAMMAR_RATINGS.map(({ label, requirement, description, icon: Icon, bgColor }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 border-2 border-black/15 bg-neutral-50 p-2 sm:p-2.5"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black ${bgColor} shadow-[1.5px_1.5px_0px_0px_#000]`}>
                  <Icon className="h-4 w-4 text-black" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-black uppercase text-black">{label}</span>
                    <span className="text-[10px] font-black text-neutral-600">[{requirement}]</span>
                  </div>
                  <p className="mt-0.5 text-[10px] font-bold text-neutral-600 sm:text-[11px]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CURRICULUM INFO PANEL */}
        <div className="mt-4 flex flex-col gap-2 border-2 border-black bg-[#A3E636] p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:mt-5 sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
            // CURRICULUM SCOPE
          </span>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-2.5 sm:py-1 sm:text-[11px]">
              <strong>12</strong> Lessons
            </span>
            <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-2.5 sm:py-1 sm:text-[11px]">
              <strong>~25</strong> Patterns
            </span>
            <span className="border-2 border-black bg-white px-2 py-0.5 text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-2.5 sm:py-1 sm:text-[11px]">
              Genki Vol 1
            </span>
          </div>
          <p className="text-[10px] font-bold leading-relaxed text-neutral-900 sm:text-xs">
            Genki Volume 1 lessons (1–12) broken down into step-by-step grammatical pattern blocks with active recall practice quizzes.
          </p>
        </div>

        {/* FOOTER ACTION */}
        <div className="mt-5 flex flex-col gap-3 border-t-2 border-black pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="block font-mono text-[10px] font-black uppercase sm:text-xs">
              READY TO PRACTICE?
            </span>
            <span className="font-mono text-[9px] font-bold text-neutral-800 sm:text-[11px]">
              Select any lesson and begin reviewing core structures.
            </span>
          </div>
          <button
            type="button"
            onClick={onStartLearning}
            className="flex w-full items-center justify-center gap-2 border-2 border-black bg-black py-2.5 px-6 font-mono text-xs font-black uppercase text-[#C084FC] shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-neutral-800 hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto sm:py-3 sm:shadow-[3px_3px_0px_0px_#000]"
          >
            START STUDYING →
          </button>
        </div>
      </section>
    </main>
  );
}