type GroupMapSkeletonProps = {
  count?: number;
  accentColor?: string;
};

export default function GroupMapSkeleton({
  count = 6,
  accentColor = '#70CFF8',
}: GroupMapSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-group-${index}`}
          style={{ borderLeftColor: accentColor }}
          className="relative flex min-h-[220px] animate-pulse flex-col justify-between overflow-hidden border-2 border-black border-l-8 bg-[#1f2637] p-4 shadow-[4px_4px_0px_0px_#000] sm:p-5"
        >
          {/* Top Bar Header Skeleton */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-white/10 pb-2.5 sm:pb-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="h-5 w-16 border-2 border-black bg-[#151922] shadow-[1px_1px_0px_0px_#000]" />
                <div className="h-5 w-20 border-2 border-black bg-white/10 shadow-[1px_1px_0px_0px_#000]" />
              </div>
              <div className="h-6 w-6 border-2 border-black bg-white/10 sm:h-7 sm:w-7" />
            </div>

            {/* Sub-label & Title Skeleton */}
            <div className="mt-2.5 space-y-1.5 sm:mt-3.5">
              <div className="h-2.5 w-20 bg-white/10" />
              <div className="h-6 w-2/3 border-2 border-black bg-white/15 sm:h-7" />
            </div>
          </div>

          {/* Progress Section Skeleton */}
          <div className="mt-3 space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-20 bg-white/10" />
              <div className="h-2.5 w-28 bg-white/10" />
            </div>
            <div className="h-3.5 overflow-hidden border-2 border-black bg-[#151922] shadow-[1.5px_1.5px_0px_0px_#000] sm:h-4">
              <div className="h-full w-1/3 bg-white/10" />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <div className="h-2.5 w-24 bg-white/10" />
              <div className="h-4 w-16 border-2 border-black bg-[#151922]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}