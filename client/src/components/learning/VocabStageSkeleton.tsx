export default function VocabStageSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-stage-${index}`}
          className="relative flex min-h-[230px] animate-pulse flex-col justify-between border-2 border-black bg-[#e0c242] p-5 shadow-[4px_4px_0px_0px_#000000]"
        >
          {/* TOP HEADER */}
          <div>
            <div className="flex items-center justify-between border-b-2 border-black/30 pb-3">
              <div className="flex items-center gap-2">
                {/* Stage Tag */}
                <div className="h-5 w-20 border-2 border-black/40 bg-black/20" />
                {/* Status Badge */}
                <div className="h-5 w-24 border-2 border-black/40 bg-black/10" />
              </div>
              {/* Arrow Pill */}
              <div className="h-7 w-7 border-2 border-black/40 bg-white/40" />
            </div>

            {/* THEME TITLE SKELETON */}
            <div className="mt-4 space-y-2">
              <div className="h-3 w-16 bg-black/20" />
              <div className="h-7 w-3/4 border-2 border-black/20 bg-black/20" />
            </div>
          </div>

          {/* BOTTOM STATS & PROGRESS BAR */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-black/20" />
              <div className="h-3 w-28 bg-black/20" />
            </div>

            {/* Progress Bar Track */}
            <div className="h-4 border-2 border-black/40 bg-white/60">
              <div className="h-full w-1/3 bg-black/10" />
            </div>

            {/* Footer Tags */}
            <div className="flex items-center justify-between pt-1">
              <div className="h-3 w-24 bg-black/20" />
              <div className="h-4 w-16 border border-black/30 bg-black/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}