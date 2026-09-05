type GroupMapSkeletonProps = {
  count?: number;
  accentColor?: string;
  fullScreen?: boolean;
  deck?: 'kanji' | 'vocab';
  withFilter?: boolean;
};

function GroupMapFilterSkeleton({ deck }: { deck: 'kanji' | 'vocab' }) {
  if (deck === 'kanji') {
    return (
      <section className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3 sm:shadow-[4px_4px_0px_0px_#000]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-9 min-w-[12rem] flex-1 border-2 border-black bg-[#1f2637] shadow-[2px_2px_0px_0px_#000] sm:h-10 sm:flex-none sm:w-1/2" />
          <div className="h-9 w-full shrink-0 border-2 border-black bg-white/20 md:w-24 sm:h-10 sm:w-28" />
        </div>
      </section>
    );
  }

  return (
    <section className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3 sm:shadow-[4px_4px_0px_0px_#000]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 sm:pb-0">
          {[1, 2, 3, 4, 5].map((tab) => <div key={tab} className="h-8 w-24 shrink-0 border-2 border-black bg-[#1f2637] sm:h-9 sm:w-28" />)}
        </div>
        <div className="flex w-full md:w-auto items-center gap-4">
          <div className="h-9 min-w-[12rem] flex-1 border-2 border-black bg-[#1f2637] shadow-[2px_2px_0px_0px_#000] sm:h-10 sm:flex-none sm:w-1/2" />
          <div className="h-9 w-24 shrink-0 border-2 border-black bg-white/20 sm:h-10 sm:w-28" />
        </div>
      </div>
    </section>
  );
}

export default function GroupMapSkeleton({
  count = 6,
  accentColor = '#70CFF8',
  fullScreen = false,
  deck = 'kanji',
  withFilter = false,
}: GroupMapSkeletonProps) {
  if (fullScreen) {
    return (
      <div className="app-route-skeleton mx-auto w-full max-w-5xl space-y-4 px-3 py-4 animate-pulse sm:space-y-6 sm:px-4 sm:py-8">
        <header className="flex items-center gap-2.5 sm:gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" />
          <div className={`flex flex-col justify-center text-left ${deck === 'kanji' ? 'space-y-0.5' : ''}`}>
            <div className="h-3 w-24 bg-white/20 sm:w-32" />
            <div className={`${deck === 'kanji' ? 'h-6 sm:h-9' : 'mt-0.5 h-7 sm:h-10'} w-40 bg-white/30 sm:w-56`} />
          </div>
        </header>
        <div className={`flex flex-col gap-1 border-t-2 border-white/20 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pt-4 ${deck === 'kanji' ? 'min-h-[42px] sm:min-h-[32px]' : ''}`}>
          <div className="h-3 w-64 bg-white/20 sm:w-80" />
          <div className="h-3 w-36 bg-white/15" />
        </div>
        <GroupMapFilterSkeleton deck={deck} />
        <GroupMapSkeleton count={count} accentColor={accentColor} deck={deck} />
      </div>
    );
  }

  return (
    <>
      {withFilter && <GroupMapFilterSkeleton deck={deck} />}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={`skeleton-group-${index}`}
            style={{ borderLeftColor: accentColor }}
            className={`relative flex animate-pulse flex-col justify-between overflow-hidden border-2 border-black border-l-8 bg-[#1f2637] shadow-[4px_4px_0px_0px_#000] ${deck === 'vocab' ? 'min-h-[200px] p-3.5 sm:min-h-[220px] sm:p-5' : 'min-h-[220px] p-4 sm:p-5'}`}
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
    </>
  );
}