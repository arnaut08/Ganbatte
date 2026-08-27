export function GenericRouteSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 py-6 sm:px-4 sm:py-8 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 sm:h-10 sm:w-10 border-2 border-black bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 bg-[#FFDE59]/40" />
          <div className="h-6 w-48 bg-white/20" />
        </div>
      </div>

      {/* Main Content Skeleton Box */}
      <div className="border-2 border-black bg-[#1a1f2c] p-4 sm:p-8 shadow-[4px_4px_0px_0px_#000000]">
        <div className="space-y-3">
          <div className="h-5 w-1/3 bg-white/10" />
          <div className="h-36 sm:h-56 w-full border-2 border-black bg-[#252c3d]" />
          <div className="h-10 w-full bg-white/15" />
        </div>
      </div>
    </div>
  );
}