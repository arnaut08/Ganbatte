type GrammarPracticeHeaderProps = {
  sessionLabel: string;
  lesson?: number | null;
  currentIndex: number;
  questionCount: number;
  progress: number;
};

function GrammarPracticeHeader({
  sessionLabel,
  lesson,
  currentIndex,
  questionCount,
  progress,
}: GrammarPracticeHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
        // {sessionLabel.toUpperCase()} SESSION: LESSON {lesson ?? 1}
          </span>
          <h1 className="text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
            Grammar {sessionLabel}
          </h1>
        </div>

        <div className="border-2 border-black bg-white px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] shrink-0">
          Q: {currentIndex + 1} / {questionCount}
        </div>
      </div>

      <div className="h-2.5 sm:h-3 w-full border-2 border-black bg-[#252c3d] shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
        <div
          className="h-full bg-[#A3E636] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}

export default GrammarPracticeHeader;
