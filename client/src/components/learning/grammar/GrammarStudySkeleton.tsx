type GrammarStudySkeletonProps = {
    fullScreen?: boolean;
};

export default function GrammarStudySkeleton({ fullScreen = false }: GrammarStudySkeletonProps) {
    const content = (
        <div className="w-full space-y-3.5 animate-pulse sm:space-y-6">
            {/* Chapter Pills Row Skeleton */}
            <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:gap-2 sm:px-0 sm:flex-wrap">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={`pill-skel-${i}`}
                        className="h-7 w-20 shrink-0 border-2 border-black bg-[#151922] shadow-[1.5px_1.5px_0px_0px_#000] sm:h-8 sm:w-24 sm:shadow-[2px_2px_0px_0px_#000]"
                    />
                ))}
            </div>

            {/* Main Presentation Deck Card Skeleton */}
            <div className="flex flex-col border-2 border-black border-l-8 border-l-[#C084FC] bg-[#1f2637] shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]">
                {/* Card Header Skeleton */}
                <div className="p-3.5 pb-2.5 sm:p-7 sm:pb-4">
                    <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="h-5 w-20 border-2 border-black bg-[#C084FC]/30 shadow-[1px_1px_0px_0px_#000]" />
                                <div className="h-5 w-20 border-2 border-black bg-white/10 shadow-[1px_1px_0px_0px_#000]" />
                            </div>
                            <div className="h-7 w-64 border-2 border-black bg-white/15 sm:h-9 sm:w-96" />
                        </div>
                        <div className="h-9 w-full border-2 border-black bg-white/20 shadow-[2px_2px_0px_0px_#000] sm:h-10 sm:w-44" />
                    </div>

                    <div className="mt-3.5 flex items-center justify-between border-y-2 border-white/10 py-1.5 sm:mt-5 sm:py-2.5">
                        <div className="h-3.5 w-24 bg-white/10" />
                        <div className="h-4 w-20 border-2 border-black bg-[#151922]" />
                    </div>
                </div>

                {/* Dynamic Slide Body Skeleton (mirrors default Overview slide) */}
                <div className="min-h-[260px] px-3.5 sm:min-h-[300px] sm:px-7 py-2 space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                        <div className="h-3.5 w-2/3 bg-white/10 sm:h-4" />
                        <div className="h-3 w-full bg-white/10" />
                        <div className="h-3 w-11/12 bg-white/10" />
                    </div>
                    <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
                        <div className="border-2 border-black bg-[#151922] p-3.5 shadow-[2px_2px_0px_0px_#000] sm:p-4">
                            <div className="h-3.5 w-28 bg-[#C084FC]/40 sm:h-4" />
                            <div className="mt-2 space-y-1.5">
                                <div className="h-3 w-full bg-white/10" />
                                <div className="h-3 w-5/6 bg-white/10" />
                                <div className="h-3 w-4/5 bg-white/10" />
                            </div>
                        </div>
                        <div className="border-2 border-black bg-[#151922] p-3.5 shadow-[2px_2px_0px_0px_#000] sm:p-4">
                            <div className="h-3.5 w-36 bg-[#C084FC]/40 sm:h-4" />
                            <div className="mt-2 space-y-1.5">
                                <div className="h-3 w-full bg-white/10" />
                                <div className="h-3 w-3/4 bg-white/10" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Nav Stepper Skeleton */}
                <div className="mt-4 flex flex-col gap-2.5 border-t-2 border-white/10 bg-[#151922]/60 p-3 sm:mt-6 sm:gap-3.5 sm:p-5">
                    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:mx-0 sm:gap-1.5 sm:px-0 sm:flex-wrap">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`tab-skel-${i}`} className="h-6 w-16 shrink-0 border-2 border-black bg-[#151922]" />
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 sm:gap-3">
                        <div className="h-8 w-20 border-2 border-black bg-white/20 sm:h-10 sm:w-24" />
                        <div className="h-8 w-20 border-2 border-black bg-[#C084FC]/30 sm:h-10 sm:w-24" />
                    </div>
                </div>
            </div>

            {/* Lesson-to-Lesson Footer Skeleton */}
            <div className="flex justify-between gap-2 pt-1 sm:gap-3">
                <div className="h-9 w-28 border-2 border-black bg-white/20 shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-36 sm:shadow-[3px_3px_0px_0px_#000]" />
                <div className="h-9 w-28 border-2 border-black bg-[#C084FC]/30 shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-36 sm:shadow-[3px_3px_0px_0px_#000]" />
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="app-route-skeleton container mx-auto max-w-4xl space-y-3.5 px-3 py-3 pb-20 animate-pulse sm:space-y-6 sm:px-4 sm:py-6 sm:pb-28">
                <div className="flex items-end gap-2.5 sm:gap-4">
                                <div className="h-9 w-9 shrink-0 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] sm:h-11 sm:w-11" />
                    <div>
                        <div className="h-3 w-24 bg-[#C084FC]/40 sm:w-32" />
                        <div className="mt-0.5 h-6 w-40 bg-white/30 sm:h-8 sm:w-56" />
                    </div>
                </div>
                {content}
            </div>
        );
    }

    return content;
}