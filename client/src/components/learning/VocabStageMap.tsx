import { ChevronRightIcon, TimerIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import type { VocabStage } from '../../types';

type VocabStageMapProps = {
  stages: VocabStage[];
  onSelectStage: (stageNumber: number) => void;
  onStartQuiz?: (stageNumber: number) => void;
};

export default function VocabStageMap({
  stages,
  onSelectStage,
  onStartQuiz,
}: VocabStageMapProps) {
  if (stages.length === 0) {
    return (
      <div className="border-2 border-black bg-[#1a1f2c] p-10 text-center shadow-[4px_4px_0px_0px_#000]">
        <p className="font-mono text-xs font-black uppercase tracking-wide text-neutral-400">
          No stages match this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stages.map((stage) => {
        const isAllLearned = stage.total_words > 0 && stage.learned_words === stage.total_words;
        const needsQuiz = isAllLearned && !stage.quiz_passed;
        const progress =
          stage.total_words > 0
            ? Math.min(100, Math.round((stage.mastered_words / stage.total_words) * 100))
            : 0;

        return (
          <article
            key={`${stage.stage_number}-${stage.theme}`}
            onClick={() => onSelectStage(stage.stage_number)}
            className="group relative flex min-h-[230px] cursor-pointer flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-5 text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {/* BACKGROUND WATERMARK DECORATION */}
            <span
              className="pointer-events-none absolute -right-2 -top-3 select-none font-mono text-7xl font-black text-black/[0.07] transition-transform group-hover:scale-110"
              aria-hidden="true"
            >
              #{String(stage.stage_number).padStart(2, '0')}
            </span>

            {/* TOP HEADER */}
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-3">
                <div className="flex items-center gap-2">
                  <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FFDE59] shadow-[1.5px_1.5px_0px_0px_#000]">
                    STAGE {String(stage.stage_number).padStart(2, '0')}
                  </span>

                  {stage.is_mastered ? (
                    <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                      ★ MASTERED
                    </span>
                  ) : stage.is_cleared ? (
                    <span className="border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                      ✓ CLEARED
                    </span>
                  ) : needsQuiz ? (
                    <span className="flex items-center gap-1 border-2 border-black bg-[#70CFF8] px-2 py-0.5 font-mono text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000]">
                      <LightningBoltIcon className="h-3 w-3 text-black animate-pulse" />
                      QUIZ READY
                    </span>
                  ) : null}
                </div>

                {/* NAV INDICATOR ICON */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-white shadow-[1.5px_1.5px_0px_0px_#000] transition-colors group-hover:bg-black group-hover:text-white">
                  <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* THEME TITLE */}
              <div className="mt-4">
                <span className="font-mono text-[9px] font-black uppercase tracking-widest text-black/60">
                  // THEME
                </span>
                <h3 className="mt-0.5 text-xl font-black uppercase tracking-tight text-black transition-colors group-hover:text-neutral-900 sm:text-2xl">
                  {stage.theme}
                </h3>
              </div>
            </div>

            {/* QUIZ READY PROMPT BANNER */}
            {needsQuiz && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onStartQuiz?.(stage.stage_number);
                }}
                className="relative z-10 my-3 flex items-center justify-between border-2 border-black bg-white p-2.5 shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-neutral-50"
              >
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase">
                  <LightningBoltIcon className="h-3.5 w-3.5 text-black" />
                  <span>Pass quiz to unlock badge</span>
                </div>
                <button
                  type="button"
                  className="border-2 border-black bg-[#A3E636] px-2.5 py-1 font-mono text-[9px] font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-[#8fe01a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  START QUIZ ⚡
                </button>
              </div>
            )}

            {/* BOTTOM STATS & PROGRESS */}
            <div className="relative z-10 mt-4 space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase">
                <span className="text-black/80">{stage.total_words} Words Total</span>
                <span>
                  {stage.mastered_words} / {stage.total_words} Mastered
                </span>
              </div>

              {/* DUAL SEGMENT PROGRESS TRACK */}
              <div
                className="h-4 overflow-hidden border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]"
                aria-label={`${progress}% mastered`}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    progress === 100
                      ? 'bg-[#A3E636]'
                      : progress > 0
                        ? 'border-r-2 border-black bg-[#70CFF8]'
                        : 'bg-transparent'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* FOOTER META TAGS */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="font-mono text-[9px] font-bold text-black/70">
                  {stage.learned_words || 0} OF {stage.total_words} LEARNED
                </span>

                {stage.due_words > 0 && (
                  <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FF6B6B] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                    <TimerIcon className="h-3 w-3" />
                    {stage.due_words} DUE
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}