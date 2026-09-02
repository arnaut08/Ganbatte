export default function GauntletSkeleton() {
  return (
    <main className="container mx-auto max-w-5xl space-y-3 px-3 py-3 pb-24 animate-pulse sm:space-y-4 sm:px-4 sm:py-6">
      <div className="flex items-center justify-between border-2 border-black bg-[#1f2637] p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 border border-black bg-[#FF6B6B]" /><div className="h-4 w-44 border border-black bg-[#151922]" /></div>
        <div className="h-6 w-20 border border-black bg-[#151922]" />
      </div>
      <div className="grid grid-cols-1 items-stretch gap-3 sm:gap-4 lg:grid-cols-12">
        <div className="flex flex-col justify-between space-y-2.5 lg:col-span-8">
          <div className="flex items-center justify-between border-2 border-black border-l-6 border-l-[#FFDE59] bg-[#1f2637] p-2.5 shadow-[3px_3px_0px_#000] sm:border-l-8 sm:p-3"><div className="h-4 w-24 border border-black bg-[#151922]" /><div className="h-4 w-20 border border-black bg-[#151922]" /><div className="h-4 w-20 border border-black bg-[#151922]" /></div>
          <div className="relative flex h-[390px] w-full items-center justify-center overflow-hidden border-4 border-black bg-[#11141d] shadow-[4px_4px_0px_#000] sm:h-[440px]"><div className="pointer-events-none absolute inset-0 grid grid-cols-3 opacity-20"><div className="border-r border-dashed border-white" /><div className="border-r border-dashed border-white" /></div><div className="absolute left-0 right-0 top-[86%] border-b-2 border-dashed border-[#FF6B6B]" /><div className="relative z-10 flex items-center gap-2.5 border-2 border-black bg-[#1f2637] px-4 py-2.5 shadow-[2px_2px_0px_#000]"><span className="h-2 w-2 animate-ping border border-black bg-[#FFDE59]" /><span className="font-mono text-xs font-black uppercase tracking-wider text-[#FFDE59]">Synchronizing combat matrix...</span></div></div>
          <div className="h-12 w-full border-2 border-black bg-[#151922] shadow-[3px_3px_0px_#000]" />
        </div>
        <aside className="flex flex-col justify-between space-y-3.5 border-2 border-black border-l-6 border-l-[#70CFF8] bg-[#1f2637] p-3.5 shadow-[3.5px_3.5px_0px_0px_#000] sm:border-l-8 sm:p-4 lg:col-span-4"><div><div className="mb-3 flex justify-between border-b border-black bg-[#151922] p-2"><div className="h-3 w-28 bg-[#70CFF8]/60" /><div className="h-3 w-16 bg-[#70CFF8]/30" /></div><div className="space-y-2 border-2 border-black bg-[#151922] p-3"><div className="flex justify-between"><div className="h-3 w-24 bg-white/20" /><div className="h-3 w-16 bg-[#FF6B6B]/50" /></div><div className="flex justify-between border-t border-white/10 pt-1.5"><div className="h-3 w-28 bg-white/15" /><div className="h-4 w-12 bg-[#70CFF8]/50" /></div></div></div><div className="space-y-2 border-2 border-black bg-[#11141d] p-3"><div className="h-3 w-full bg-white/15" /><div className="h-7 w-full border border-black bg-[#151922]" /><div className="h-3 w-4/5 bg-white/10" /></div><div className="space-y-1.5 border border-black/50 bg-[#151922] p-2.5"><div className="h-3 w-32 bg-white/20" /><div className="h-2.5 w-full bg-white/10" /><div className="h-2.5 w-4/5 bg-white/10" /></div></aside>
      </div>
    </main>
  );
}