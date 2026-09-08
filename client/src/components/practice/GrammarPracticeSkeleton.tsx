type GrammarPracticeSkeletonProps = {
  forceResults?: boolean;
  showForfeit?: boolean;
};

export default function GrammarPracticeSkeleton({ forceResults = false, showForfeit = false }: GrammarPracticeSkeletonProps) {
  if (forceResults) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-3.5 px-3 py-3 pb-20 animate-pulse sm:space-y-6 sm:px-4 sm:py-6 sm:pb-28">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="h-8 w-8 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]" />
            <div className="flex flex-col justify-center">
              <div className="h-3 w-40 bg-[#C084FC]/60 sm:w-56" />
              <div className="mt-0.5 h-5 w-44 bg-white/30 sm:h-7 sm:w-64" />
            </div>
          </div>
          <div className="h-6 w-28 border-2 border-black bg-[#A3E636]/50 sm:h-7 sm:w-36" />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4">
          {[1, 2].map((player) => (
            <section key={player} className="h-44 border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:h-52 sm:p-5 sm:shadow-[6px_6px_0px_0px_#000]">
              <div className="flex justify-between"><div className="h-5 w-24 bg-[#C084FC]/60" /><div className="h-4 w-8 bg-white/20" /></div>
              <div className="my-5 h-10 w-32 bg-white/30 sm:my-7 sm:h-14 sm:w-44" />
              <div className="h-3 w-full bg-white/10" />
            </section>
          ))}
        </div>

        <div className="h-10 w-full border-2 border-black bg-[#A3E636]/40 sm:h-11" />
        <section className="space-y-2 pt-2 sm:pt-4">
          <div className="h-4 w-56 bg-[#C084FC]/60" />
          {[1, 2, 3].map((card) => <div key={card} className="h-24 border-2 border-black bg-[#1f2637] shadow-[2px_2px_0px_0px_#000]" />)}
        </section>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 px-3 py-3 pb-20 animate-pulse sm:space-y-4 sm:px-4 sm:py-4 sm:pb-24">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <div className="h-3 w-48 bg-[#C084FC]/60 sm:w-64" />
          <div className="mt-0.5 h-5 w-40 bg-white/30 sm:h-7 sm:w-56" />
        </div>
        <div className="h-7 w-20 shrink-0 border-2 border-black bg-white/30 sm:h-8 sm:w-24" />
      </div>
      <div className="h-2.5 w-full border-2 border-black bg-[#151922] sm:h-3" />

      {showForfeit && (
        <div className="flex justify-end">
          <div className="h-7 w-28 border-2 border-black bg-[#FF6B6B]/60" />
        </div>
      )}

      <div className="relative overflow-hidden border-2 border-black bg-[#1f2637] p-3.5 shadow-[3px_3px_0px_0px_#000] sm:p-7 sm:shadow-[6px_6px_0px_0px_#000]">
        <div className="h-24 w-full border-2 border-black bg-[#151922] sm:h-32" />
        <div className="mt-3.5 grid gap-2 sm:mt-6 sm:grid-cols-2 sm:gap-3">
          <div className="h-12 border-2 border-black bg-[#151922] sm:h-14" />
          <div className="h-12 border-2 border-black bg-[#151922] sm:h-14" />
          <div className="h-12 border-2 border-black bg-[#151922] sm:h-14" />
          <div className="h-12 border-2 border-black bg-[#151922] sm:h-14" />
        </div>
        <div className="mt-3.5 h-10 w-full border-2 border-black bg-[#C084FC]/40 sm:mt-6 sm:h-12" />
      </div>
    </div>
  );
}
