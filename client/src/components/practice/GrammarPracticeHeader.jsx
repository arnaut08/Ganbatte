function GrammarPracticeHeader({ sessionLabel, lesson, currentIndex, questionCount, progress }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // {sessionLabel.toUpperCase()} SESSION: LESSON {lesson ?? 1}
          </span>
          <h1 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            Grammar {sessionLabel}
          </h1>
        </div>

        <div className="border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black text-black shadow-[2px_2px_0px_0px_#000000]">
          Q: {currentIndex + 1} / {questionCount}
        </div>
      </div>

      <div className="h-3 w-full border-2 border-black bg-[#252c3d] shadow-[2px_2px_0px_0px_#000000]">
        <div
          className="h-full bg-[#A3E636] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}

export default GrammarPracticeHeader;
