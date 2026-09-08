export function MasteryPassportSkeleton() {
  return (
    <main className="container mx-auto max-w-5xl space-y-3 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-8 pb-20 sm:pb-28 animate-pulse">
      {/* 1. Header Section Skeleton */}
      <div className="flex items-start gap-2.5 sm:gap-4">
        {/* Back Button */}
        <div className="h-8 w-8 sm:h-11 sm:w-11 shrink-0 border-2 border-black bg-[#252c3d] shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]" />

        <div className="space-y-1.5 sm:space-y-2">
          {/* Sub-label tag */}
          <div className="h-2.5 w-32 sm:h-3 sm:w-44 border border-black bg-[#A3E636]/30" />
          {/* Main Title */}
          <div className="h-6 w-48 sm:h-8 sm:w-72 border border-black bg-white/20" />
        </div>
      </div>

      {/* 2. Top Stats Strip Skeleton (3 Cards) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between border-2 border-black bg-[#252c3d] p-3 sm:p-4 shadow-[3px_3px_0px_0px_#000000] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-20 bg-white/20 border border-black" />
              <div className="h-3 w-10 bg-black/50 border border-black" />
            </div>
            <div className="h-6 sm:h-7 w-28 bg-white/30 border border-black" />
            <div className="flex items-center justify-between border-t border-black/40 pt-1.5">
              <div className="h-2 w-16 bg-white/10" />
              <div className="h-2 w-24 bg-white/20" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Core Learning Modules Grid Skeleton (4 Cards) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Card 01 // Kana Mastery */}
        <div className="flex flex-col border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          <div className="bg-[#FFDE59]/40 p-3 sm:p-4 border-b-2 border-black flex items-center justify-between">
            <div className="h-3 w-32 bg-black/40" />
            <div className="h-3 w-14 bg-black/40" />
          </div>
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="h-3 w-full border-2 border-black bg-[#252c3d]" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((cell) => (
                <div key={cell} className="border border-black/40 bg-[#252c3d] p-2 space-y-1.5">
                  <div className="h-2 w-16 bg-white/20" />
                  <div className="h-3.5 w-10 bg-[#FFDE59]/30" />
                </div>
              ))}
            </div>
            <div className="h-9 sm:h-10 w-full border-2 border-black bg-[#FFDE59]/30 shadow-[2px_2px_0px_0px_#000000]" />
          </div>
        </div>

        {/* Card 02 // N5 Kanji Groups */}
        <div className="flex flex-col border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          <div className="bg-[#70CFF8]/40 p-3 sm:p-4 border-b-2 border-black flex items-center justify-between">
            <div className="h-3 w-36 bg-black/40" />
            <div className="h-3 w-16 bg-black/40" />
          </div>
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="h-3 w-full border-2 border-black bg-[#252c3d]" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((cell) => (
                <div key={cell} className="border border-black/40 bg-[#252c3d] p-2 space-y-1.5">
                  <div className="h-2 w-20 bg-white/20" />
                  <div className="h-3.5 w-10 bg-[#70CFF8]/30" />
                </div>
              ))}
            </div>
            <div className="h-9 sm:h-10 w-full border-2 border-black bg-[#70CFF8]/30 shadow-[2px_2px_0px_0px_#000000]" />
          </div>
        </div>

        {/* Card 03 // Vocab SRS */}
        <div className="flex flex-col border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          <div className="bg-[#A3E636]/40 p-3 sm:p-4 border-b-2 border-black flex items-center justify-between">
            <div className="h-3 w-28 bg-black/40" />
            <div className="h-3 w-20 bg-black/40" />
          </div>
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="h-3 w-full border-2 border-black bg-[#252c3d]" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((cell) => (
                <div key={cell} className="border border-black/40 bg-[#252c3d] p-2 space-y-1.5">
                  <div className="h-2 w-12 bg-white/20 mx-auto" />
                  <div className="h-4 w-8 bg-[#A3E636]/30 mx-auto" />
                </div>
              ))}
            </div>
            <div className="h-9 sm:h-10 w-full border-2 border-black bg-[#A3E636]/30 shadow-[2px_2px_0px_0px_#000000]" />
          </div>
        </div>

        {/* Card 04 // Grammar */}
        <div className="flex flex-col border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000000] overflow-hidden">
          <div className="bg-[#C084FC]/40 p-3 sm:p-4 border-b-2 border-black flex items-center justify-between">
            <div className="h-3 w-24 bg-black/40" />
            <div className="h-3 w-20 bg-black/40" />
          </div>
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="h-3 w-full border-2 border-black bg-[#252c3d]" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((cell) => (
                <div key={cell} className="border border-black/40 bg-[#252c3d] p-2 space-y-1.5">
                  <div className="h-2 w-16 bg-white/20" />
                  <div className="h-3.5 w-12 bg-[#C084FC]/30" />
                </div>
              ))}
            </div>
            <div className="h-9 sm:h-10 w-full border-2 border-black bg-[#C084FC]/30 shadow-[2px_2px_0px_0px_#000000]" />
          </div>
        </div>
      </div>

      {/* 4. PvP Match Snapshot Skeleton */}
      <div className="border-2 border-black bg-[#151922] p-3 sm:p-4 shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-2.5 w-36 bg-[#70CFF8]/40 border border-black" />
            <div className="h-4 w-60 bg-white/20 border border-black" />
          </div>
          <div className="h-8 sm:h-9 w-48 sm:w-56 border-2 border-black bg-[#70CFF8]/30 shadow-[2px_2px_0px_0px_#000000]" />
        </div>
      </div>
    </main>
  );
}