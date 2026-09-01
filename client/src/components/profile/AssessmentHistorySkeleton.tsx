type AssessmentHistorySkeletonProps = {
  fullScreen?: boolean;
};

export default function AssessmentHistorySkeleton({ fullScreen = false }: AssessmentHistorySkeletonProps) {
  if (fullScreen) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-4 px-3 py-4 pb-20 animate-pulse sm:space-y-6 sm:px-4 sm:py-8 sm:pb-28">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4"><div className="flex items-center gap-2.5 sm:gap-4"><div className="h-9 w-9 border-2 border-black bg-[#252c3d] shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" /><div className="space-y-1.5"><div className="h-3 w-32 bg-[#FFDE59]/40" /><div className="h-6 w-56 bg-white/30 sm:w-72" /></div></div><div className="h-7 w-28 border-2 border-black bg-[#70CFF8]/30" /></div>
        <div className="space-y-3"><AssessmentHistorySkeleton /></div>
      </main>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center justify-between border-2 border-black bg-[#1f2637] p-4 shadow-[3px_3px_0px_0px_#000] sm:p-5 sm:shadow-[4px_4px_0px_0px_#000]">
          <div className="space-y-2">
            <div className="h-5 w-36 bg-[#151922] sm:w-44" />
            <div className="h-3.5 w-24 bg-[#151922] sm:w-32" />
          </div>
          <div className="h-10 w-16 bg-[#151922] sm:h-12 sm:w-20" />
        </div>
      ))}
    </div>
  );
}