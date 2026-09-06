type AssessmentLoadingScreenProps = {
  title?: string;
  description?: string;
  accent?: string;
};

function AssessmentLoadingScreen({
  title = 'PREPARING GRAMMAR DECK',
  description = 'Generating randomized question sets and synchronizing operators...',
  accent = '#C084FC',
}: AssessmentLoadingScreenProps) {
  return (
    <main className="container mx-auto max-w-3xl space-y-3 sm:space-y-4 px-3 py-3 sm:px-4 sm:py-4 pb-20 sm:pb-24 animate-pulse">
      {/* 1. Header & Skeleton HUD */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex w-full flex-row items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="h-3 sm:h-4 w-28 sm:w-40 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]" style={{ backgroundColor: `${accent}99` }} />
            <h1 className="text-base sm:text-3xl font-black uppercase tracking-tight text-white leading-tight truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 border-2 border-black bg-white px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] shrink-0">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 animate-ping" style={{ backgroundColor: accent }} />
            <span>SYNCING</span>
          </div>
        </div>

        {/* Indeterminate Animated Progress Strip */}
        <div className="relative h-2.5 sm:h-3.5 w-full overflow-hidden border-2 border-black bg-[#151922] p-0.5 shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
          <div className="h-full w-1/3 border-r-2 border-black animate-[shimmer_1.5s_infinite_linear]" style={{ backgroundColor: accent }} />
        </div>
      </div>

      {/* 2. Main Arena Card Skeleton */}
      <div className="border-2 border-black bg-[#1f2637] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] space-y-3.5 sm:space-y-5">
        {/* Target Phrase Hero Box Skeleton */}
        <div className="border-2 border-black bg-[#151922] p-3.5 sm:p-8 shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] space-y-3 sm:space-y-6" style={{ borderLeftColor: accent }}>
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 sm:h-5 w-20 sm:w-28 border border-black bg-white/10" />
            <div className="h-3 sm:h-4 w-24 sm:w-32 bg-white/10" />
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:gap-2 py-2 sm:py-4">
            <div className="h-6 sm:h-8 w-3/4 border-2 border-black bg-white/20 shadow-[1.5px_1.5px_0px_0px_#000]" />
            <div className="h-6 sm:h-8 w-1/2 border-2 border-black bg-white/20 shadow-[1.5px_1.5px_0px_0px_#000]" />
          </div>

          <div className="mx-auto h-3 sm:h-4 w-32 sm:w-44 bg-white/10" />
        </div>

        {/* Input / Action Form Skeleton */}
        <div className="flex w-full flex-row items-center gap-2 sm:gap-3">
          <div className="h-10 sm:h-13 flex-1 border-2 border-black bg-[#151922] shadow-[2px_2px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000]" />
          <div className="h-10 sm:h-13 w-24 shrink-0 border-2 border-black bg-[#151922] shadow-[2px_2px_0px_0px_#000] sm:w-32 sm:shadow-[4px_4px_0px_0px_#000]" />
        </div>

        {/* Opponent Status Skeleton Bar */}
        <div className="flex items-center justify-between border-t-2 border-white/10 pt-3 sm:pt-4">
          <div className="h-7 sm:h-9 w-32 sm:w-48 border-2 border-black bg-[#151922] shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]" />
          <div className="h-5 sm:h-6 w-20 sm:w-28 bg-white/10" />
        </div>
      </div>

      {/* Subtext Status Description */}
      <p className="text-center font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
        // {description.toUpperCase()}
      </p>
    </main>
  );
}

export default AssessmentLoadingScreen;