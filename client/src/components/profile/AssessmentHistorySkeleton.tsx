type AssessmentHistorySkeletonProps = {
  fullScreen?: boolean;
};

export default function AssessmentHistorySkeleton({ fullScreen = false }: AssessmentHistorySkeletonProps) {
  if (fullScreen) {
    return (
      <div className="app-route-skeleton mx-auto w-full max-w-4xl space-y-4 px-3 py-4 pb-20 animate-pulse sm:space-y-6 sm:px-4 sm:py-8 sm:pb-28">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" />
            <div className="flex flex-col justify-center text-left"><div className="h-3 w-32 bg-[#FFDE59]/40" /><div className="mt-0.5 h-7 w-56 bg-white/30 sm:h-9 sm:w-72" /></div>
          </div>
          <div className="h-7 w-28 border-2 border-black bg-[#70CFF8]/30 sm:h-8 sm:w-32" />
        </div>
        <AssessmentHistorySkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="flex flex-col justify-between gap-3 border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-3.5 text-white shadow-[3px_3px_0px_0px_#000] sm:flex-row sm:items-center sm:p-4 sm:shadow-[4px_4px_0px_0px_#000]"
        >
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="h-5 w-28 border-2 border-black bg-[#FFDE59]/50 sm:w-36" />
              <div className="h-5 w-16 border border-white/20 bg-[#151922] sm:w-20" />
            </div>
            <div className="h-3 w-44 bg-[#151922] sm:w-56" />
          </div>

          <div className="flex items-center justify-between border-t-2 border-white/10 pt-2 sm:justify-end sm:gap-4 sm:border-t-0 sm:pt-0">
            <div className="space-y-1 text-left sm:text-right">
              <div className="h-3 w-16 bg-white/15 sm:ml-auto sm:w-20" />
              <div className="h-3 w-24 bg-[#151922] sm:ml-auto sm:w-28" />
            </div>
            <div className="h-10 w-14 border-2 border-black bg-[#FFDE59]/50 shadow-[2px_2px_0px_0px_#000] sm:h-12 sm:w-[68px]" />
          </div>
        </div>
      ))}
    </div>
  );
}