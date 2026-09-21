export default function TugOfWarArenaSkeleton() {
    return (
        <main className="mx-auto min-h-[calc(100dvh-5rem)] max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6">
            <header className="flex items-center justify-between gap-3 border-b-2 border-black/20 pb-3 animate-pulse">
                <div className="space-y-1">
                    <div className="h-4 w-44 border border-black bg-[#C084FC]/60 sm:w-56" />
                    <div className="h-2.5 w-32 bg-white/10 sm:w-40" />
                </div>
                <div className="h-7 w-24 border-2 border-black bg-[#FF6B6B]/50 shadow-[2px_2px_0px_0px_#000]" />
            </header>

            <div className="flex flex-col items-start justify-center gap-5 sm:gap-6 lg:grid lg:grid-cols-[240px_minmax(0,500px)_240px] xl:grid-cols-[280px_minmax(0,560px)_280px]">
                <aside className="order-3 w-full space-y-4 border-2 border-black border-l-4 border-l-[#C084FC] bg-[#151922] p-4 shadow-[4px_4px_0px_0px_#000] lg:order-1 animate-pulse">
                    <div className="h-3 w-28 bg-[#C084FC]/60" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="flex gap-2">
                                <div className="h-3 w-5 bg-white/20" />
                                <div className="h-3 flex-1 bg-white/10" />
                            </div>
                        ))}
                    </div>
                </aside>

                <section className="order-1 w-full space-y-4 lg:order-2">
                    <div className="flex items-end justify-between animate-pulse">
                        <div className="h-3 w-24 bg-[#70CFF8]/60" />
                        <div className="h-3 w-24 bg-white/15" />
                        <div className="h-3 w-24 bg-[#A3E636]/60" />
                    </div>
                    <div className="h-12 w-full border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000] animate-pulse">
                        <div className="h-full w-1/3 bg-[#70CFF8]/45" />
                    </div>

                    {/* Deck Generation Terminal Output */}
                    <div className="flex min-h-[180px] flex-col items-center justify-center border-2 border-black bg-[#151922] px-4 py-6 shadow-[6px_6px_0px_0px_#000] sm:min-h-[220px] sm:px-8">
                        <span className="mb-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#C084FC] animate-pulse">
              // SECURE CONNECTION ESTABLISHED
                        </span>
                        <h1 className="text-center font-mono text-xl font-black uppercase leading-tight text-white sm:text-3xl">
                            Synthesizing Grammar Protocols
                        </h1>
                        <div className="mt-6 flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-neutral-500">AWAITING QUESTION DECK</span>
                            <div className="flex gap-1.5">
                                <div className="h-1.5 w-1.5 bg-[#FFDE59] animate-[ping_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                                <div className="h-1.5 w-1.5 bg-[#FFDE59] animate-[ping_1.5s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
                                <div className="h-1.5 w-1.5 bg-[#FFDE59] animate-[ping_1.5s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-pulse">
                        {[1, 2, 3, 4].map((option) => (
                            <div key={option} className="h-20 border-2 border-black border-b-[6px] bg-white/5 sm:h-28" />
                        ))}
                    </div>
                </section>

                <aside className="order-2 w-full space-y-4 border-2 border-black border-l-4 border-l-[#70CFF8] bg-[#151922] p-4 shadow-[4px_4px_0px_0px_#000] lg:order-3 animate-pulse">
                    <div className="flex items-center justify-between border-b border-white/20 pb-3">
                        <div className="h-3 w-32 bg-[#C084FC]/60" />
                        <div className="h-2 w-2 rounded-full bg-[#A3E636]/60" />
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((metric) => (
                            <div key={metric} className="flex justify-between">
                                <div className="h-3 w-24 bg-white/15" />
                                <div className="h-3 w-8 bg-white/20" />
                            </div>
                        ))}
                    </div>
                </aside>
            </div>
        </main>
    );
}