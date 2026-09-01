type KanaFilterSkeletonProps = {
  fullScreen?: boolean;
};

export default function KanaFilterSkeleton({ fullScreen = false }: KanaFilterSkeletonProps) {
  if (fullScreen) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-3 px-3 py-4 pb-24 animate-pulse sm:space-y-4 sm:px-4 sm:py-6 sm:pb-28">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <div className="h-9 w-9 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" />
            <div className="space-y-1.5"><div className="h-3 w-48 bg-[#FFDE59]" /><div className="h-7 w-64 bg-white/30 sm:w-80" /></div>
          </div>
          <div className="flex gap-1.5"><div className="h-7 w-28 border-2 border-black bg-[#151922]" /><div className="h-7 w-28 border-2 border-black bg-[#151922]" /><div className="h-7 w-24 border-2 border-black bg-white/40" /></div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">{[1, 2, 3, 4].map((tab) => <div key={tab} className="h-8 w-24 border-2 border-black bg-[#151922]" />)}</div>
        <div className="flex items-start gap-2 border-2 border-black bg-[#151922] p-3 shadow-[3px_3px_0px_0px_#000]"><div className="h-3 w-10 bg-[#FFDE59]" /><div className="h-3 flex-1 bg-white/10" /></div>
        <div className="grid gap-3.5 sm:gap-6 lg:grid-cols-2">
          {[1, 2].map((matrix) => <div key={matrix} className="h-64 border-2 border-black bg-[#151922] shadow-[3px_3px_0px_0px_#000] sm:h-96" />)}
        </div>
        <div className="h-11 w-full border-2 border-black bg-[#FFDE59]/30" />
      </main>
    );
  }

  return (
    <div className="grid gap-3.5 sm:gap-6 lg:grid-cols-2 animate-pulse">
      <div className="h-64 border-2 border-black bg-[#151922] shadow-[3px_3px_0px_0px_#000] sm:h-96" />
      <div className="h-64 border-2 border-black bg-[#151922] shadow-[3px_3px_0px_0px_#000] sm:h-96" />
    </div>
  );
}