import { CheckCircledIcon, StarFilledIcon } from '@radix-ui/react-icons';

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
    label: 'CLEARED',
    requirement: 'SCORE ≥ 80%',
    description: 'Pass any practice quiz with 80% or higher.',
    icon: CheckCircledIcon,
    badgeBg: 'bg-white text-black',
    iconColor: 'text-black',
  },
  {
    label: 'MASTERED',
    requirement: '100% OR 2 CONSECUTIVE DAYS (≥ 80%)',
    description: 'Achieve a perfect score or pass on 2 separate days.',
    icon: StarFilledIcon,
    badgeBg: 'bg-[#C084FC] text-black',
    iconColor: 'text-black',
  },
];

export default function GrammarIntroScreen({ onBack, onStartLearning }: GrammarIntroScreenProps) {
  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4 sm:py-8 pb-20 sm:pb-24">
      {/* HEADER */}
      <header className="mb-3 flex items-start gap-2.5 sm:mb-6 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to learning"
          aria-label="Back to learning"
        >
          <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
        </button>
        <div className="flex flex-col -mt-1 sm:-mt-1.5 text-left">
          <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#C084FC] leading-tight">
            // PRACTICE: GRAMMAR
          </span>
          <h1 className="mt-0.5 text-lg sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
            Genki Grammar Recall
          </h1>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <section className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#C084FC] bg-[#1f2637] p-3.5 sm:p-7 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] space-y-3 sm:space-y-5">
        <div>
          <span className="border-2 border-black bg-[#C084FC] px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]">
            04 // STUDY SETUP
          </span>
          <h2 className="mt-1.5 text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Master grammar patterns.
          </h2>
          <p className="mt-1 font-mono text-xs sm:text-sm font-medium leading-relaxed text-neutral-300">
            Study Genki Volume 1 lessons, take recall quizzes, and clear lessons to unlock consecutive-day mastery and build long-term retention.
          </p>
        </div>

        {/* 3 STEPS */}
        <div className="space-y-1.5 sm:space-y-2">
          <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-400">
            HOW IT WORKS: 3 EASY STEPS
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {GRAMMAR_STEPS.map((step) => (
              <div
                key={step.number}
                className="flex sm:flex-col items-start gap-2.5 sm:gap-0 border-2 border-black bg-[#151922] p-2.5 sm:p-4 font-mono shadow-[2px_2px_0px_0px_#000]"
              >
                <span
                  className="shrink-0 px-1.5 py-0.5 text-[9px] sm:text-xs font-black border border-black text-black"
                  style={{ backgroundColor: step.color }}
                >
                  {step.number}
                </span>
                <div className="min-w-0">
                  <h3 className="sm:mt-2 text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                    {step.title}
                  </h3>
                  <p className="mt-0.5 sm:mt-1 text-[11px] font-medium leading-snug text-neutral-300">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LESSON OUTCOME LEGENDS */}
        <div className="border-2 border-black bg-[#151922] p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
          <span className="mb-2 block text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-400">
            LESSON OUTCOME LEGENDS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {GRAMMAR_RATINGS.map(({ label, requirement, description, icon: Icon, badgeBg, iconColor }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 border-2 border-black bg-[#1f2637] p-2.5 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000]"
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black ${badgeBg} shadow-[1px_1px_0px_0px_#000]`}
                >
                  <Icon
                    className={`h-4 w-4 ${iconColor} ${Icon === CheckCircledIcon ? 'translate-x-[0.5px] -translate-y-[0.5px]' : ''}`}
                  />
                </div>
                <div className="min-w-0 font-mono">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="text-xs font-black uppercase text-white">{label}</span>
                    <span className="text-[9px] font-bold uppercase text-[#C084FC]">[{requirement}]</span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-medium text-neutral-300 leading-snug">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CURRICULUM SCOPE */}
        <div className="border-2 border-black bg-[#151922] border-l-4 border-l-[#C084FC] p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#C084FC]">
            CURRICULUM SCOPE
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5 sm:gap-2">
            <span className="border-2 border-black bg-[#1f2637] px-2 py-0.5 text-[10px] sm:text-[11px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000]">
              <strong className="text-[#C084FC]">12</strong> Lessons
            </span>
            <span className="border-2 border-black bg-[#1f2637] px-2 py-0.5 text-[10px] sm:text-[11px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000]">
              <strong className="text-[#C084FC]">~25</strong> Patterns
            </span>
            <span className="border-2 border-black bg-[#1f2637] px-2 py-0.5 text-[10px] sm:text-[11px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000]">
              Genki Vol 1
            </span>
          </div>
          <p className="mt-1.5 text-[11px] sm:text-xs font-medium leading-relaxed text-neutral-300">
            Genki Volume 1 lessons (1–12) broken down into step-by-step grammatical pattern blocks with active recall practice quizzes.
          </p>
        </div>

        {/* FOOTER ACTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t-2 border-black/40 pt-3 sm:pt-4">
          <div>
            <span className="block font-mono text-[10px] sm:text-xs font-black uppercase text-white">
              READY TO PRACTICE?
            </span>
            <span className="font-mono text-[10px] sm:text-[11px] font-medium text-neutral-400">
              Select any lesson and begin reviewing core structures.
            </span>
          </div>
          <button
            type="button"
            onClick={onStartLearning}
            className="w-full sm:w-auto cursor-pointer border-2 border-black bg-white px-5 py-2.5 sm:px-6 sm:py-3 font-mono text-xs font-black uppercase text-black shadow-[2.5px_2.5px_0px_0px_#000] hover:bg-[#C084FC] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-center"
          >
            START STUDYING →
          </button>
        </div>
      </section>
    </main>
  );
}