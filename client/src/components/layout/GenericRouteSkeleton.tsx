type GenericRouteSkeletonProps = {
  status?: string;
};

export function GenericRouteSkeleton({ status }: GenericRouteSkeletonProps) {
  const isGridRoute = status === 'passport' || status?.includes('study') || status?.includes('intro');
  const isSocialRoute = status === 'friends';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8 pb-20 sm:pb-28 animate-pulse">
      {/* 1. Header Bar Skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000]" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 border border-black bg-[#FFDE59] shadow-[1px_1px_0px_0px_#000]" />
            <div className="h-6 w-44 sm:w-64 bg-white/30" />
          </div>
        </div>
        <div className="h-7 w-20 sm:w-28 border-2 border-black bg-[#70CFF8] shadow-[1.5px_1.5px_0px_0px_#000]" />
      </div>

      {/* 2. Dynamic Content Area Skeleton */}
      {isSocialRoute ? (
        /* Two-Column Social / Friends Layout */
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
            <div className="h-4 w-32 bg-[#70CFF8]/60" />
            <div className="h-10 w-full border-2 border-black bg-[#151922]" />
            <div className="space-y-2 pt-2">
              <div className="h-12 w-full border-2 border-black bg-[#151922]" />
              <div className="h-12 w-full border-2 border-black bg-[#151922]" />
            </div>
          </div>
          <div className="border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-5 shadow-[4px_4px_0px_0px_#000] space-y-3">
            <div className="h-4 w-32 bg-[#A3E636]/60" />
            <div className="h-14 w-full border-2 border-black bg-[#151922]" />
            <div className="h-14 w-full border-2 border-black bg-[#151922]" />
            <div className="h-14 w-full border-2 border-black bg-[#151922]" />
          </div>
        </div>
      ) : isGridRoute ? (
        /* 2x2 Learning Modules Grid Layout */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-24 border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] shadow-[3px_3px_0px_0px_#000]" />
            <div className="h-24 border-2 border-black border-l-8 border-l-[#FF6B6B] bg-[#1f2637] shadow-[3px_3px_0px_0px_#000]" />
            <div className="h-24 border-2 border-black border-l-8 border-l-[#FB923C] bg-[#1f2637] shadow-[3px_3px_0px_0px_#000]" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-56 border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000] overflow-hidden">
              <div className="h-10 bg-[#FFDE59] border-b-2 border-black" />
            </div>
            <div className="h-56 border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000] overflow-hidden">
              <div className="h-10 bg-[#70CFF8] border-b-2 border-black" />
            </div>
          </div>
        </div>
      ) : (
        /* General Assessment / Single Card Layout */
        <div className="space-y-3">
          <div className="border-2 border-black border-l-8 border-l-[#C084FC] bg-[#1f2637] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-[#C084FC]/70" />
              <div className="h-3.5 w-28 bg-white/20" />
            </div>
            <div className="h-12 w-16 border-2 border-black bg-[#FFDE59]" />
          </div>
          <div className="border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-[#70CFF8]/70" />
              <div className="h-3.5 w-28 bg-white/20" />
            </div>
            <div className="h-12 w-16 border-2 border-black bg-[#A3E636]" />
          </div>
          <div className="border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-[#FFDE59]/70" />
              <div className="h-3.5 w-28 bg-white/20" />
            </div>
            <div className="h-12 w-16 border-2 border-black bg-[#FF6B6B]" />
          </div>
        </div>
      )}
    </div>
  );
}