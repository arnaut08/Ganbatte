export default function StudySkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      <div className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3 sm:shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center justify-between">
          <div className="h-3 w-32 border border-black/40 bg-white/20" />
          <div className="h-3 w-20 border border-black/40 bg-white/20" />
        </div>
        <div className="mt-2 h-3.5 border-2 border-black bg-white/10">
          <div className="h-full w-1/4 bg-[#A3E636]/40" />
        </div>
      </div>
      <div className="flex min-h-[440px] flex-col justify-between border-2 border-black bg-[#e0c242] p-4 shadow-[4px_4px_0px_0px_#000] sm:min-h-[480px] sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]">
        <div className="flex items-center justify-between border-b-2 border-black/40 pb-3">
          <div className="h-5 w-20 border-2 border-black/40 bg-black/20" />
          <div className="h-5 w-16 border-2 border-black/40 bg-white/40" />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center space-y-3 py-6">
          <div className="h-3 w-36 bg-black/20" />
          <div className="h-14 w-52 border-2 border-black/20 bg-black/20 sm:h-16 sm:w-64" />
          <div className="h-4 w-28 bg-black/20" />
          <div className="h-3 w-20 bg-black/20" />
        </div>
        <div className="flex flex-col gap-3 border-t-2 border-black/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-6 w-24 border-2 border-black/20 bg-white/40" />
          <div className="h-10 w-full border-2 border-black/40 bg-black/30 sm:w-44" />
        </div>
      </div>
    </div>
  );
}
