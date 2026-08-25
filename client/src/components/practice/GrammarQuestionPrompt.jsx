function GrammarQuestionPrompt({ question }) {
  return (
    <div className="relative border-2 border-black bg-[#FFDE59] p-5 shadow-[4px_4px_0px_0px_#000000]">
      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black/60">
        QUESTION PROMPT
      </span>
      <p className="jp-font mt-1 text-lg font-black leading-snug text-black sm:text-xl">
        {question?.prompt}
      </p>
      {question?.englishText && (
        <p className="mt-2 font-mono text-xs font-bold text-black/80">
          EN: {question.englishText}
        </p>
      )}
    </div>
  );
}

export default GrammarQuestionPrompt;
