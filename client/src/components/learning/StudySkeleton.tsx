type StudySkeletonProps = {
  accentColor?: string;
};

export default function StudySkeleton({
  accentColor = '#70CFF8',
}: StudySkeletonProps) {
  return (
    <div className="w-full space-y-3.5 sm:space-y-5 animate-pulse">
      {/* Top Progress Track Skeleton */}
      <div className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3 sm:shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 bg-white/10" />
          <div className="h-3 w-20 bg-white/10" />
        </div>
        <div className="mt-2 h-4 overflow-hidden border-2 border-black bg-[#1f2637] shadow-[1px_1px_0px_0px_#000] sm:h-4.5">
          <div
            className="h-full w-1/4 opacity-40"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </div>

      {/* Main Flashcard Base Skeleton */}
      <div
        style={{ borderLeftColor: accentColor }}
        className="flex min-h-[460px] flex-col justify-between border-2 border-black border-l-8 bg-[#1f2637] p-4 shadow-[4px_4px_0px_0px_#000] sm:min-h-[500px] sm:p-6 sm:shadow-[6px_6px_0px_0px_#000]"
      >
        {/* Card Header Skeleton */}
        <div className="flex items-center justify-between border-b-2 border-white/10 pb-2.5 sm:pb-3">
          <div
            className="h-5 w-20 border-2 border-black opacity-30 shadow-[1px_1px_0px_0px_#000]"
            style={{ backgroundColor: accentColor }}
          />
          <div className="h-4 w-16 bg-white/10" />
        </div>

        {/* Center Prompt Stage Well Skeleton */}
        <div className="my-3 flex flex-1 flex-col items-center justify-center border-2 border-black bg-[#151922] py-8 text-center shadow-[3px_3px_0px_0px_#000] sm:my-4 sm:py-10">
          <div className="h-3 w-40 bg-white/10" />
          <div className="my-4 h-24 w-32 border-2 border-black/40 bg-white/15 sm:h-32 sm:w-40" />
          <div className="h-3 w-24 bg-white/10" />
        </div>

        {/* Card Footer Button Skeleton */}
        <div className="w-full">
          <div className="h-10 w-full border-2 border-black bg-white/20 shadow-[2px_2px_0px_0px_#000] sm:h-12 sm:shadow-[3px_3px_0px_0px_#000]" />
        </div>
      </div>
    </div>
  );
}