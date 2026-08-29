import { ChevronRightIcon, TimerIcon } from '@radix-ui/react-icons';
import type { VocabStage } from '../../types';

type VocabStageMapProps = {
  stages: VocabStage[];
  onSelectStage: (stageNumber: number) => void;
};

export default function VocabStageMap({ stages, onSelectStage }: VocabStageMapProps) {
  if (stages.length === 0) {
    return (
      <div className="border-2 border-black bg-[#1a1f2c] p-10 text-center shadow-[4px_4px_0px_0px_#000]">
        <p className="font-mono text-xs font-black uppercase tracking-wide text-neutral-400">No stages match this filter.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stages.map((stage) => {
        const progress = stage.total_words > 0 ? Math.round((stage.mastered_words / stage.total_words) * 100) : 0;
        return (
          <button
            key={`${stage.stage_number}-${stage.theme}`}
            type="button"
            onClick={() => onSelectStage(stage.stage_number)}
            className="group flex min-h-[214px] flex-col justify-between border-2 border-black bg-[#FFDE59] p-4 text-left text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <div>
              <div className="flex items-start justify-between gap-3 border-b-2 border-black pb-3">
                <span className="font-mono text-xs font-black uppercase tracking-wider">Stage {stage.stage_number}</span>
                <ChevronRightIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xl font-black uppercase leading-tight tracking-tight">{stage.theme}</h3>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-2 font-mono text-[10px] font-black uppercase">
                <span>{stage.total_words} Words</span>
                <span>{stage.mastered_words}/{stage.total_words} Mastered</span>
              </div>
              <div className="h-5 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000]" aria-label={`${progress}% mastered`}>
                <div className="h-full border-r-2 border-black bg-[#70CFF8] transition-all" style={{ width: `${progress}%` }} />
              </div>
              {stage.due_words > 0 && (
                <span className="inline-flex items-center gap-1.5 border-2 border-black bg-[#FF6B6B] px-2 py-1 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_#000]">
                  <TimerIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {stage.due_words} Due for Review
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}