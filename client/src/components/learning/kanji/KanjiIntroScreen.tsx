import {
    CheckCircledIcon,
    ExclamationTriangleIcon,
    LightningBoltIcon,
    ThickArrowRightIcon,
} from '@radix-ui/react-icons';
import GlobalPageHeader from '../../common/GlobalPageHeader';

type KanjiIntroScreenProps = {
    onBack: () => void;
    onStartLearning: () => void;
};

const KANJI_STEPS = [
    {
        number: '01',
        title: 'CHOOSE',
        description: 'Select a group or filter by reviews due.',
        color: '#FF6B6B',
    },
    {
        number: '02',
        title: 'RECALL',
        description: 'Recall reading & meaning before flipping the card.',
        color: '#FFDE59',
    },
    {
        number: '03',
        title: 'RATE',
        description: 'Mark Again, Hard, Good, or Easy to tune intervals.',
        color: '#70CFF8',
    },
];

const ratings = [
    { label: 'AGAIN', description: 'REVIEW SOON', icon: ExclamationTriangleIcon, color: '#FF6B6B' },
    { label: 'HARD', description: 'NEEDS DRILL', icon: LightningBoltIcon, color: '#FFDE59' },
    { label: 'GOOD', description: 'IN MEMORY', icon: CheckCircledIcon, color: '#70CFF8' },
    { label: 'EASY', description: 'MASTERED', icon: ThickArrowRightIcon, color: '#A3E636' },
];

export default function KanjiIntroScreen({ onBack, onStartLearning }: KanjiIntroScreenProps) {
    return (
        <main className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4 sm:py-8 pb-20 sm:pb-24">
            {/* HEADER */}
            <div className="mb-3 sm:mb-6">
                <GlobalPageHeader
                    onBack={onBack}
                    punchline="// PRACTICE: KANJI GROUPS"
                    title="Active Kanji Recall"
                    accentClass="text-[#70CFF8]"
                />
            </div>

            {/* MAIN CONTAINER */}
            <section className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-3.5 sm:p-7 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] space-y-3 sm:space-y-5">
                <div>
                    <span className="border-2 border-black bg-[#70CFF8] px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]">
                        02 // STUDY SETUP
                    </span>
                    <h2 className="mt-1.5 text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
                        Make Kanji stick.
                    </h2>
                    <p className="mt-1 font-mono text-xs sm:text-sm font-medium leading-relaxed text-neutral-300">
                        Select thematic Kanji groups, practice on/kun readings from memory, and rate confidence to calibrate your spaced-repetition intervals.
                    </p>
                </div>

                {/* 3 STEPS */}
                <div className="space-y-1.5 sm:space-y-2">
                    <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-400">
                        HOW IT WORKS: 3 EASY STEPS
                    </span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                        {KANJI_STEPS.map(({ number, title, description, color }) => (
                            <div
                                key={number}
                                className="flex sm:flex-col items-start gap-2.5 sm:gap-0 border-2 border-black bg-[#151922] p-2.5 sm:p-4 font-mono shadow-[2px_2px_0px_0px_#000]"
                            >
                                <span
                                    className="shrink-0 px-1.5 py-0.5 text-[9px] sm:text-xs font-black border border-black text-black"
                                    style={{ backgroundColor: color }}
                                >
                                    {number}
                                </span>
                                <div className="min-w-0">
                                    <h3 className="sm:mt-2 text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                                        {title}
                                    </h3>
                                    <p className="mt-0.5 sm:mt-1 text-[11px] font-medium leading-snug text-neutral-300">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SRS RATINGS: 2x2 on mobile, 4-Col on desktop */}
                <div className="border-2 border-black bg-[#151922] p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
                    <span className="mb-2 block text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-400">
                        SRS RECALL RATINGS
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                        {ratings.map(({ label, description, icon: Icon, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div
                                    className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center border-2 border-black shadow-[1px_1px_0px_0px_#000]"
                                    style={{ backgroundColor: color }}
                                >
                                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-black" />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[11px] sm:text-xs font-black uppercase text-white truncate">
                                        {label}
                                    </span>
                                    <span className="block text-[9px] sm:text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                                        {description}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GROUP MASTERY INFO */}
                <div className="border-2 border-black bg-[#151922] border-l-4 border-l-[#70CFF8] p-3 font-mono shadow-[2px_2px_0px_0px_#000] sm:p-4">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#70CFF8]">
                        CLEAR &amp; MASTERY BADGES
                    </span>
                    <p className="mt-1 text-[11px] sm:text-xs font-medium leading-relaxed text-neutral-300">
                        Learn all characters in a group and pass the 80% quiz to earn <strong className="text-white">CLEARED</strong>. Maintain all characters at high recall to unlock <strong className="text-[#70CFF8]">MASTERED</strong>.
                    </p>
                </div>

                {/* FOOTER ACTION */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t-2 border-black/40 pt-3 sm:pt-4">
                    <div>
                        <span className="block font-mono text-[10px] sm:text-xs font-black uppercase text-white">
                            READY TO PRACTICE?
                        </span>
                        <span className="font-mono text-[10px] sm:text-[11px] font-medium text-neutral-400">
                            Configure your Kanji group next.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onStartLearning}
                        className="w-full sm:w-auto cursor-pointer border-2 border-black bg-white px-5 py-2.5 sm:px-6 sm:py-3 font-mono text-xs font-black uppercase text-black shadow-[2.5px_2.5px_0px_0px_#000] hover:bg-[#70CFF8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-center"
                    >
                        CHOOSE GROUP →
                    </button>
                </div>
            </section>
        </main>
    );
}