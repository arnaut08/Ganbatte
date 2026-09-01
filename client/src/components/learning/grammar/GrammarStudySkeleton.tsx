export default function GrammarStudySkeleton() {
    return (
        <div className="w-full space-y-4 animate-pulse sm:space-y-6">
            {/* Chapter Pills Row Skeleton */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:gap-2 sm:flex-wrap">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={`pill-skel-${i}`}
                        className="h-7 w-20 shrink-0 border-2 border-black bg-[#151922] shadow-[1.5px_1.5px_0px_0px_#000] sm:h-8 sm:w-24 sm:shadow-[2px_2px_0px_0px_#000]"
                    />
                ))}
            </div>

            {/* Main Presentation Deck Card Skeleton */}
            <div className="flex flex-col border-2 border-black border-l-8 border-l-[#C084FC] bg-[#1f2637] shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]">
                {/* Card Header Skeleton */}
                <div className="p-4 pb-3 sm:p-7 sm:pb-4">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="h-5 w-20 border-2 border-black bg-[#C084FC]/30 shadow-[1px_1px_0px_0px_#000]" />
                                <div className="h-5 w-20 border-2 border-black bg-white/10 shadow-[1px_1px_0px_0px_#000]" />
                            </div>
                            <div className="h-7 w-64 border-2 border-black bg-white/15 sm:h-9 sm:w-96" />
                        </div>
                        <div className="h-9 w-full border-2 border-black bg-white/20 shadow-[2px_2px_0px_0px_#000] sm:h-10 sm:w-44" />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-y-2 border-white/10 py-2">
                        <div className="h-3.5 w-24 bg-white/10" />
                        <div className="h-4 w-20 border-2 border-black bg-[#151922]" />
                    </div>
                </div>

                {/* Content Body Wells Skeleton */}
                <div className="min-h-[260px] space-y-3 px-4 py-2 sm:min-h-[300px] sm:space-y-4 sm:px-7">
                    <div className="h-4 w-full bg-white/10" />
                    <div className="h-4 w-5/6 bg-white/10" />
                    <div className="grid gap-3 pt-2 sm:grid-cols-2">
                        <div className="h-28 border-2 border-black bg-[#151922] shadow-[2px_2px_0px_0px_#000]" />
                        <div className="h-28 border-2 border-black bg-[#151922] shadow-[2px_2px_0px_0px_#000]" />
                    </div>
                </div>

                {/* Bottom Nav Stepper Skeleton */}
                <div className="mt-4 border-t-2 border-white/10 bg-[#151922]/40 p-3 sm:mt-6 sm:p-5">
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`tab-skel-${i}`} className="h-6 w-20 shrink-0 border border-black bg-white/10" />
                        ))}
                    </div>
                    <div className="mt-3 flex justify-between pt-1">
                        <div className="h-8 w-20 border-2 border-black bg-white/20" />
                        <div className="h-8 w-20 border-2 border-black bg-[#C084FC]/30" />
                    </div>
                </div>
            </div>
        </div>
    );
}