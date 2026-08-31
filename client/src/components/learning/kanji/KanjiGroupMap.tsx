import { ChevronRightIcon, RocketIcon, TimerIcon } from '@radix-ui/react-icons';
import type { KanjiGroupOverview } from '../../../types';

type Props = {
    groups: KanjiGroupOverview[];
    onSelect: (groupId: string) => void;
    onQuiz: (groupId: string) => void;
};

export default function KanjiGroupMap({ groups, onSelect, onQuiz }: Props) {
    if (!groups.length) {
        return (
            <div className="border-2 border-black bg-[#151922] p-8 text-center font-mono text-xs font-black uppercase text-neutral-400">
                No Kanji groups available.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
            {groups.map((group, index) => {
                const groupNum = String(index + 1).padStart(2, '0');
                const allLearned =
                    group.total_characters > 0 && group.learned_characters === group.total_characters;
                const needsQuiz = allLearned && !group.quiz_passed;
                const percent = group.total_characters
                    ? Math.min(100, Math.round((group.mastered_characters / group.total_characters) * 100))
                    : 0;

                return (
                    <article
                        key={group.group_id}
                        onClick={() => onSelect(group.group_id)}
                        className="group relative flex min-h-[220px] cursor-pointer flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-4 text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:p-5"
                    >
                        {/* WATERMARK */}
                        <span
                            className="pointer-events-none absolute -right-1 -top-2 select-none font-mono text-6xl font-black text-black/[0.06] transition-transform group-hover:scale-105 sm:-right-2 sm:-top-3 sm:text-7xl"
                            aria-hidden="true"
                        >
                            #{groupNum}
                        </span>

                        {/* TOP BAR & TITLE */}
                        <div className="relative z-10">
                            <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5 sm:pb-3">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <span className="border-2 border-black bg-black px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#FFDE59] shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[10px]">
                                        GROUP {groupNum}
                                    </span>

                                    {group.is_mastered ? (
                                        <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[9px]">
                                            ★ MASTERED
                                        </span>
                                    ) : group.is_cleared ? (
                                        <span className="border-2 border-black bg-white px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[9px]">
                                            ✓ CLEARED
                                        </span>
                                    ) : needsQuiz ? (
                                        <span className="flex items-center gap-1 border-2 border-black bg-[#70CFF8] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000] sm:px-2 sm:text-[9px]">
                                            <RocketIcon className="h-2.5 w-2.5 text-black" />
                                            QUIZ READY
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-black bg-white shadow-[1px_1px_0px_0px_#000] transition-colors group-hover:bg-black group-hover:text-white sm:h-7 sm:w-7">
                                    <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                                </div>
                            </div>

                            {/* THEME */}
                            <div className="mt-2.5 sm:mt-3.5">
                                <span className="font-mono text-[8px] font-black uppercase tracking-widest text-black/60 sm:text-[9px]">
                  // KANJI GROUP
                                </span>
                                <h2 className="text-lg font-black uppercase tracking-tight text-black sm:text-2xl">
                                    {group.theme}
                                </h2>
                            </div>
                        </div>

                        {/* QUIZ PROMPT (NEO-BRUTALIST BANNER WITH BUTTON HOVER/ACTIVE STATES) */}
                        {needsQuiz && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuiz(group.group_id);
                                }}
                                className="relative z-10 my-2.5 flex items-center justify-between border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-neutral-50 sm:p-2.5"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="flex h-5 w-5 items-center justify-center border-2 border-black bg-[#70CFF8]">
                                        <RocketIcon className="h-3 w-3 text-black" />
                                    </span>
                                    <span className="font-mono text-[9px] font-black uppercase tracking-tight text-black sm:text-[10px]">
                                        Pass quiz to master
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="flex items-center gap-1 border-2 border-black bg-[#A3E636] px-2.5 py-1 font-mono text-[9px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-[10px]"
                                >
                                    START →
                                </button>
                            </div>
                        )}

                        {/* PROGRESS TRACK */}
                        <div className="relative z-10 mt-3 space-y-1.5 sm:space-y-2">
                            <div className="flex items-center justify-between font-mono text-[9px] font-black uppercase sm:text-[10px]">
                                <span className="text-black/80">{group.total_characters} Characters</span>
                                <span>
                                    {group.mastered_characters}/{group.total_characters} Mastered
                                </span>
                            </div>

                            <div
                                className="h-3.5 overflow-hidden border-2 border-black bg-white shadow-[1.5px_1.5px_0px_0px_#000] sm:h-4"
                                aria-label={`${percent}% mastered`}
                            >
                                <div
                                    className={`h-full transition-all duration-300 ${percent === 100
                                            ? 'bg-[#A3E636]'
                                            : percent > 0
                                                ? 'border-r-2 border-black bg-[#70CFF8]'
                                                : 'bg-transparent'
                                        }`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                                <span className="font-mono text-[8px] font-bold text-black/70 sm:text-[9px]">
                                    {group.learned_characters || 0} OF {group.total_characters} LEARNED
                                </span>

                                {group.due_characters > 0 && (
                                    <span className="inline-flex items-center gap-1 border-2 border-black bg-[#FF6B6B] px-1.5 py-0.5 font-mono text-[8px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000] sm:text-[9px]">
                                        <TimerIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                        {group.due_characters} DUE
                                    </span>
                                )}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}