import { ChevronRightIcon, TimerIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import type { VocabStage } from '../../../types';

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
      <div className="border-2 border-black bg-[#151922] p-8 text-center shadow-[3px_3px_0px_0px_#000]">
        <p className="font-mono text-xs font-black uppercase tracking-wide text-neutral-400">
          No stages match this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
      {stages.map((stage) => {
        const stageNum = String(stage.stage_number).padStart(2, '0');
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
            className="group relative flex min-h-[200px] cursor-pointer flex-col justify-between overflow-hidden border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-3.5 text-white shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:min-h-[220px] sm:p-5"
          >
            {/* Outlined Wireframe Stage Number Watermark */}
            <span
              className="pointer-events-none absolute -bottom-3 -right-2 select-none font-mono text-[80px] sm:text-[105px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
              style={{ WebkitTextStroke: '2px rgba(163, 230, 54, 0.15)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.webkitTextStroke = '2px rgba(163, 230, 54, 0.35)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.webkitTextStroke = '2px rgba(163, 230, 54, 0.15)';
              }}
              aria-hidden="true"
            >
              #{stageNum}
            </span>

            {/* TOP BAR */}
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 border-b-2 border-white/10 pb-2.5 sm:pb-3">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="border-2 border-black bg-[#151922] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#A3E636] shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[10px]">
                    STAGE {stageNum}
                  </span>

                  {stage.is_mastered ? (
                    <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[9px]">
                      ★ MASTERED
                    </span>
                  ) : stage.is_cleared ? (
                    <span className="border-2 border-black bg-white px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[9px]">
                      ✓ CLEARED
                    </span>
                  ) : needsQuiz ? (
                    <span className="flex items-center gap-1 border-2 border-black bg-[#70CFF8] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[9px]">
                      <LightningBoltIcon className="h-2.5 w-2.5 text-black animate-pulse" />
                      QUIZ READY
                    </span>
                  ) : null}
                </div>

                <div className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[1px_1px_0px_0px_#000] transition-colors group-hover:bg-[#A3E636] sm:h-7 sm:w-7">
                  <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                </div>
              </div>

              {/* THEME TITLE */}
              <div className="mt-2.5 sm:mt-3.5">
                <span className="font-mono text-[8px] font-black uppercase tracking-widest text-neutral-400 sm:text-[9px]">
                  // VOCAB STAGE
                </span>
                <h3 className="text-lg font-black uppercase tracking-tight text-white sm:text-2xl">
                  {stage.theme}
                </h3>
              </div>
            </div>

            {/* QUIZ PROMPT */}
            {needsQuiz && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onStartQuiz?.(stage.stage_number);
                }}
                className="relative z-10 my-2 flex items-center justify-between border-2 border-black bg-[#151922] p-2 shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-[#252c3d]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center border-2 border-black bg-[#70CFF8]">
                    <LightningBoltIcon className="h-3 w-3 text-black" />
                  </span>
                  <span className="font-mono text-[9px] font-black uppercase tracking-tight text-white sm:text-[10px]">
                    Pass quiz for badge
                  </span>
                </div>
                <button
                  type="button"
                  className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[8px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] sm:px-2.5 sm:py-1 sm:text-[9px]"
                >
                  START <LightningBoltIcon className="inline-block h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* PROGRESS TRACK */}
            <div className="relative z-10 mt-3 space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between font-mono text-[9px] font-black uppercase sm:text-[10px]">
                <span className="text-neutral-400">{stage.total_words} Words</span>
                <span className="text-white">
                  {stage.mastered_words}/{stage.total_words} Mastered
                </span>
              </div>

              <div
                className="h-3.5 overflow-hidden border-2 border-black bg-[#151922] shadow-[1.5px_1.5px_0px_0px_#000] sm:h-4"
                aria-label={`${progress}% mastered`}
              >
                <div
                  className={`h-full transition-all duration-300 ${progress === 100
                      ? 'bg-[#A3E636]'
                      : progress > 0
                        ? 'border-r-2 border-black bg-[#A3E636]'
                        : 'bg-transparent'
                    }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="font-mono text-[8px] font-bold text-neutral-400 sm:text-[9px]">
                  {stage.learned_words || 0} OF {stage.total_words} LEARNED
                </span>

                {stage.due_words > 0 && (
                  <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FF6B6B] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000] sm:text-[9px]">
                    <TimerIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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