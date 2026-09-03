export function HomeSkeleton() {
  return (
    <div className="app-home-content flex items-center justify-center p-3 pb-20 animate-pulse sm:p-4 sm:pb-24">
      <div className="w-full max-w-5xl">
        <div className="space-y-3 sm:space-y-6">
          <section className="mx-auto w-full max-w-4xl space-y-2 border-2 border-black bg-[#151922] p-2.5 text-white shadow-[3px_3px_0px_0px_#000] sm:space-y-3 sm:p-4 sm:shadow-[6px_6px_0px_0px_#000]">
            <div className="flex items-center justify-between gap-2 border-b-2 border-white/20 pb-2">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <div className="h-4 w-16 border border-black bg-[#A3E636]/50 sm:h-5 sm:w-20" />
                <div className="h-3 w-24 bg-white/20 sm:w-32" />
              </div>
              <div className="flex shrink-0 gap-1.5 sm:gap-2">
                <div className="h-5 w-12 border-2 border-black bg-[#252c3d] sm:h-6 sm:w-16" />
                <div className="h-5 w-12 border-2 border-black bg-[#252c3d] sm:h-6 sm:w-16" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 lg:grid-cols-4">
              {[1, 2, 3, 4].map((pillar) => (
                <div key={pillar} className="border-2 border-black bg-[#1f2637] border-l-4 p-2 sm:p-3" style={{ borderLeftColor: ['#FFDE59', '#70CFF8', '#A3E636', '#C084FC'][pillar - 1] }}>
                  <div className="flex items-center justify-between">
                    <div className="h-2.5 w-16 bg-white/20 sm:h-3 sm:w-20" />
                    <div className="h-3 w-3 bg-white/20 sm:h-3.5 sm:w-3.5" />
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <div className="h-2.5 w-14 bg-white/10 sm:h-3 sm:w-16" />
                    <div className="h-2.5 w-10 bg-white/20 sm:h-3 sm:w-12" />
                  </div>
                  <div className="mt-1 h-1.5 w-full border border-black bg-[#151922] sm:h-2" />
                </div>
              ))}
            </div>
          </section>

          <div className="mx-auto grid max-w-4xl gap-3 sm:gap-6 md:grid-cols-2">
            {[1, 2].map((card) => (
              <section key={card} className="flex min-h-[148px] flex-col justify-between border-2 border-black border-l-8 bg-[#1f2637] p-3.5 shadow-[4px_4px_0px_0px_#000] sm:min-h-[244px] sm:p-6 sm:shadow-[7px_7px_0px_0px_#000]" style={{ borderLeftColor: card === 1 ? '#FFDE59' : '#70CFF8' }}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="h-4 w-28 border-2 border-black bg-white/20 sm:h-5 sm:w-36" />
                    <div className="h-3 w-20 bg-white/10 sm:h-4 sm:w-24" />
                  </div>
                  <div className="mt-1 h-6 w-40 bg-white/25 sm:h-8 sm:w-52" />
                  <div className="mt-1.5 hidden space-y-1.5 sm:block">
                    <div className="h-3 w-full bg-white/10" />
                    <div className="h-3 w-4/5 bg-white/10" />
                  </div>
                </div>
                <div className="h-10 w-full border-2 border-black bg-white/20 shadow-[2.5px_2.5px_0px_0px_#000] sm:h-16 sm:shadow-[4px_4px_0px_0px_#000]" />
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}