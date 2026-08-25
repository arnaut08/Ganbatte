type AssessmentLoadingScreenProps = {
  title?: string;
  description?: string;
};

function AssessmentLoadingScreen({
  title = 'PREPARING GRAMMAR DECK',
  description = 'Generating randomized question sets and synchronizing operators...',
}: AssessmentLoadingScreenProps) {
  return (
    <main className="container mx-auto max-w-3xl space-y-4 px-4 py-4 animate-pulse">
      {/* 1. Header & Skeleton HUD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-4 w-40 border-2 border-black bg-[#FFDE59]/60 shadow-[2px_2px_0px_0px_#000]" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl leading-tight">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2 border-2 border-black bg-[#A3E636] px-3 py-1 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000]">
            <span className="h-2 w-2 animate-ping bg-black" />
            <span>SYNCING</span>
          </div>
        </div>

        {/* Indeterminate Animated Progress Strip */}
        <div className="relative h-3.5 w-full overflow-hidden border-2 border-black bg-[#1a1f2c] p-0.5 shadow-[2px_2px_0px_0px_#000000]">
          <div className="h-full w-1/3 border-r-2 border-black bg-[#A3E636] animate-[shimmer_1.5s_infinite_linear]" />
        </div>
      </div>

      {/* 2. Main Arena Card Skeleton */}
      <div className="border-2 border-black bg-[#1a1f2c] p-5 shadow-[6px_6px_0px_0px_#000000] space-y-5 sm:p-6">
        
        {/* Target Phrase Hero Box Skeleton */}
        <div className="border-2 border-black bg-[#FFDE59]/40 p-6 shadow-[4px_4px_0px_0px_#000000] space-y-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 border border-black bg-black/40" />
            <div className="h-4 w-32 bg-black/20" />
          </div>

          {/* Skeleton Japanese Target Text */}
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-8 w-3/4 border-2 border-black bg-black/30 shadow-[2px_2px_0px_0px_#000]" />
            <div className="h-8 w-1/2 border-2 border-black bg-black/30 shadow-[2px_2px_0px_0px_#000]" />
          </div>

          <div className="mx-auto h-4 w-44 bg-black/30" />
        </div>

        {/* Input / Action Form Skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="h-13 flex-1 border-2 border-black bg-[#252c3d] shadow-[4px_4px_0px_0px_#000000]" />
          <div className="h-13 w-full sm:w-32 border-2 border-black bg-[#252c3d] shadow-[4px_4px_0px_0px_#000000]" />
        </div>

        {/* Opponent Status Skeleton Bar */}
        <div className="flex items-center justify-between border-t-2 border-neutral-700/60 pt-4">
          <div className="h-9 w-48 border-2 border-black bg-[#252c3d] shadow-[2px_2px_0px_0px_#000000]" />
          <div className="h-6 w-28 bg-neutral-700/60" />
        </div>
      </div>

      {/* Subtext Status Description */}
      <p className="text-center font-mono text-xs font-bold text-neutral-400">
        // {description}
      </p>
    </main>
  );
}

export default AssessmentLoadingScreen;