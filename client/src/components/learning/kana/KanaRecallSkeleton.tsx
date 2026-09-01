type KanaRecallSkeletonProps = {
  fullScreen?: boolean;
};

export default function KanaRecallSkeleton({ fullScreen = false }: KanaRecallSkeletonProps) {
  if (fullScreen) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-3 px-3 py-4 pb-20 animate-pulse sm:space-y-5 sm:px-4 sm:py-6 sm:pb-28">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4"><div className="flex items-center gap-2.5 sm:gap-4"><div className="h-9 w-9 border-2 border-black bg-[#252c3d] shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" /><div className="space-y-1.5"><div className="h-3 w-40 bg-[#FFDE59]/40" /><div className="h-6 w-56 bg-white/30" /></div></div><div className="h-7 w-24 border-2 border-black bg-[#151922]" /></div>
        <section className="border-2 border-black border-l-8 border-l-[#FFDE59]/60 bg-[#1f2637] p-4 shadow-[4px_4px_0px_0px_#000] sm:p-8"><div className="flex justify-between border-b-2 border-white/10 pb-3"><div className="h-3 w-32 bg-[#FFDE59]/40" /><div className="h-3 w-16 bg-white/20" /></div><div className="my-3 border-2 border-black bg-[#151922] p-4 shadow-[3px_3px_0px_0px_#000] sm:my-6 sm:p-8"><div className="mx-auto h-28 w-28 bg-white/20 sm:h-40 sm:w-40" /></div><div className="space-y-3"><div className="h-3 w-56 bg-white/20" /><div className="h-10 w-full border-2 border-black bg-[#151922] sm:h-12" /><div className="h-10 w-32 border-2 border-black bg-[#A3E636]/30" /></div></section>
      </main>
    );
  }

  return (
    <section className="border-2 border-black border-l-8 border-l-[#FFDE59]/60 bg-[#1f2637] p-4 text-white shadow-[4px_4px_0px_0px_#000] animate-pulse sm:p-8 sm:shadow-[6px_6px_0px_0px_#000]">
      <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 sm:pb-3">
        <div className="h-3 w-32 bg-[#FFDE59]/40" />
        <div className="h-3 w-16 bg-white/20" />
      </div>
      <div className="my-3 border-2 border-black bg-[#151922] p-4 shadow-[3px_3px_0px_0px_#000] sm:my-6 sm:p-8 sm:shadow-[4px_4px_0px_0px_#000]">
        <div className="mx-auto h-28 w-28 bg-white/20 sm:h-40 sm:w-40" />
      </div>
      <div className="space-y-2.5 sm:space-y-3">
        <div className="h-3 w-56 bg-white/20" />
        <div className="h-10 w-full border-2 border-black bg-[#151922] sm:h-12" />
        <div className="h-10 w-32 border-2 border-black bg-[#A3E636]/30 sm:h-11" />
      </div>
    </section>
  );
}