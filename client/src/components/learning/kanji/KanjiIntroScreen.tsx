import {
    CheckCircledIcon,
    ExclamationTriangleIcon,
    LightningBoltIcon,
    ThickArrowRightIcon,
} from '@radix-ui/react-icons';

type KanjiIntroScreenProps = {
    onBack: () => void;
    onStartLearning: () => void;
};

const ratings = [
    { label: 'Again', description: 'review soon', icon: ExclamationTriangleIcon, color: '#FF6B6B' },
    { label: 'Hard', description: 'needs drill', icon: LightningBoltIcon, color: '#FFDE59' },
    { label: 'Good', description: 'in memory', icon: CheckCircledIcon, color: '#70CFF8' },
    { label: 'Easy', description: 'mastered', icon: ThickArrowRightIcon, color: '#A3E636' },
];

export default function KanjiIntroScreen({ onBack, onStartLearning }: KanjiIntroScreenProps) {
    return (
        <main className="mx-auto w-full max-w-4xl px-3 py-4 sm:px-4 sm:py-8">
            {/* HEADER */}
            <header className="mb-4 flex items-center gap-2.5 sm:mb-6 sm:gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
                    title="Back to learning"
                    aria-label="Back to learning"
                >
                    <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
                </button>
                <div className="flex flex-col justify-center text-left">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-400 sm:text-xs">
            // PRACTICE: KANJI GROUPS
                    </span>
                    <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
                        Active Kanji Recall
                    </h1>
                </div>
            </header>

            {/* MAIN CONTAINER */}
            <section className="border-2 border-black bg-[#FFDE59] p-3.5 text-black shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000]">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-black/80 sm:text-xs">
          // STUDY SETUP
                </span>
                <h2 className="mt-0.5 text-2xl font-black uppercase tracking-tight sm:mt-1 sm:text-4xl">
                    Make Kanji stick.
                </h2>
                <p className="mt-1 font-mono text-xs font-bold leading-relaxed text-neutral-900 sm:mt-2 sm:text-sm">
                    Select thematic Kanji groups, practice on/kun readings from memory, and rate confidence to calibrate your spaced-repetition intervals.
                </p>

                <hr className="my-3.5 border-t-2 border-black sm:my-6" />

                {/* 3 STEPS */}
                <div className="space-y-1.5 sm:space-y-2">
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider sm:text-xs">
                        HOW IT WORKS: 3 EASY STEPS
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                        {/* STEP 1 */}
                        <div className="border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
                            <span className="text-[10px] font-black text-[#FF6B6B] sm:text-xs">01</span>
                            <h3 className="text-xs font-black uppercase tracking-wide sm:text-sm">CHOOSE</h3>
                            <p className="mt-0.5 text-[10px] font-bold text-neutral-700 sm:text-[11px]">
                                Select a group or filter by reviews due.
                            </p>
                        </div>

                        {/* STEP 2 */}
                        <div className="border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
                            <span className="text-[10px] font-black text-[#FFDE59] sm:text-xs">02</span>
                            <h3 className="text-xs font-black uppercase tracking-wide sm:text-sm">RECALL</h3>
                            <p className="mt-0.5 text-[10px] font-bold text-neutral-700 sm:text-[11px]">
                                Recall reading & meaning before flipping the card.
                            </p>
                        </div>

                        {/* STEP 3 */}
                        <div className="border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
                            <span className="text-[10px] font-black text-[#70CFF8] sm:text-xs">03</span>
                            <h3 className="text-xs font-black uppercase tracking-wide sm:text-sm">RATE</h3>
                            <p className="mt-0.5 text-[10px] font-bold text-neutral-700 sm:text-[11px]">
                                Mark Again, Hard, Good, or Easy to tune intervals.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SRS RATINGS BADGES */}
                <div className="mt-3.5 border-2 border-black bg-white p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:mt-6 sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
                    <span className="mb-2 block text-[10px] font-black uppercase tracking-wider text-black sm:mb-3 sm:text-xs">
                        SRS RECALL RATINGS
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
                        {ratings.map(({ label, description, icon: Icon, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div
                                    className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black sm:h-8 sm:w-8"
                                    style={{ backgroundColor: color }}
                                >
                                    <Icon className="h-3 w-3 text-black sm:h-3.5 sm:w-3.5" />
                                </div>
                                <span className="text-[10px] font-bold text-neutral-900 sm:text-xs">
                                    {label}: {description}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GROUP MASTERY INFO */}
                <div className="mt-3 border-2 border-black bg-[#70CFF8] p-2.5 font-mono shadow-[2px_2px_0px_0px_#000] sm:mt-6 sm:p-4 sm:shadow-[3px_3px_0px_0px_#000]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-black sm:text-xs">
                        CLEAR &amp; MASTERY BADGES
                    </span>
                    <p className="mt-0.5 text-[10px] font-bold leading-relaxed text-neutral-900 sm:mt-1 sm:text-xs">
                        Learn all characters in a group and pass the 80% quiz to earn <span className="underline">CLEARED</span>. Maintain all characters at high recall to unlock <span className="underline">MASTERED</span>.
                    </p>
                </div>

                {/* FOOTER ACTION */}
                <div className="mt-4 flex flex-col gap-2.5 border-t-2 border-black pt-3.5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                    <div>
                        <span className="block font-mono text-[10px] font-black uppercase sm:text-xs">
                            READY TO PRACTICE?
                        </span>
                        <span className="font-mono text-[9px] font-bold text-neutral-800 sm:text-[11px]">
                            Configure your Kanji group next.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onStartLearning}
                        className="flex w-full items-center justify-center gap-2 border-2 border-black bg-black py-2.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-neutral-800 hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:w-auto sm:px-6 sm:py-3 sm:shadow-[3px_3px_0px_0px_#000]"
                    >
                        CHOOSE GROUP →
                    </button>
                </div>
            </section>
        </main>
    );
}