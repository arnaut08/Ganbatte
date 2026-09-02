export default function GauntletSkeleton() {
  return (
    <main className="container mx-auto max-w-5xl space-y-4 px-3 py-3 pb-20 animate-pulse sm:px-4 sm:py-6">
      <div className="flex items-center justify-between border-2 border-black bg-[#1f2637] p-3 shadow-[3px_3px_0px_#000]">
        <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 border border-black bg-[#FF6B6B]" /><div className="h-4 w-44 border border-black bg-[#151922]" /></div>
        <div className="h-6 w-20 border border-black bg-[#151922]" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12">
        <div className="space-y-3 md:col-span-8">
          <div className="flex items-center justify-between border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-3 shadow-[3px_3px_0px_#000]"><div className="h-4 w-24 border border-black bg-[#151922]" /><div className="h-4 w-20 border border-black bg-[#151922]" /><div className="h-4 w-20 border border-black bg-[#151922]" /></div>
          <div className="relative flex h-[380px] items-center justify-center overflow-hidden border-4 border-black bg-[#151922] shadow-[4px_4px_0px_#000] sm:h-[430px]"><div className="pointer-events-none absolute inset-0 grid grid-cols-3 opacity-20"><div className="border-r border-dashed border-white" /><div className="border-r border-dashed border-white" /></div><div className="absolute left-0 right-0 top-[88%] border-b-2 border-dashed border-[#FF6B6B]/40" /><div className="relative z-10 flex items-center gap-2.5 border-2 border-black bg-[#1f2637] px-4 py-2.5 shadow-[2px_2px_0px_#000]"><span className="h-2 w-2 animate-ping border border-black bg-[#FFDE59]" /><span className="font-mono text-xs font-black uppercase tracking-wider text-[#FFDE59]">Synchronizing combat matrix...</span></div></div>
          <div className="h-12 w-full border-2 border-black bg-[#1f2637] shadow-[2.5px_2.5px_0px_#000]" />
        </div>
        <div className="space-y-3 border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-4 shadow-[3px_3px_0px_#000] md:col-span-4"><div className="flex justify-between border-b border-white/10 pb-2"><div className="h-3 w-28 border border-black bg-[#151922]" /><div className="h-3 w-8 border border-black bg-[#151922]" /></div><div className="space-y-2 border border-black bg-[#151922] p-3"><div className="h-4 w-full bg-[#1f2637]" /><div className="h-4 w-3/4 bg-[#1f2637]" /></div><div className="space-y-2 border border-black/40 bg-[#151922] p-3"><div className="h-3 w-20 bg-[#1f2637]" /><div className="h-2.5 w-full bg-[#1f2637]" /><div className="h-2.5 w-4/5 bg-[#1f2637]" /></div></div>
      </div>
    </main>
  );
}