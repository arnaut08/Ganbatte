import type { GrammarQuestion } from '../../types';

type GrammarQuestionPromptProps = {
  question?: GrammarQuestion | null;
};

function GrammarQuestionPrompt({ question }: GrammarQuestionPromptProps) {
  return (
    <div className="relative border-2 border-black bg-[#FFDE59] p-3.5 sm:p-5 shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
      <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-black/60">
        QUESTION PROMPT
      </span>
      <p className="jp-font mt-0.5 sm:mt-1 text-sm sm:text-xl font-black leading-snug text-black">
        {question?.prompt}
      </p>
      {question?.englishText && (
        <p className="mt-1 sm:mt-2 font-mono text-[10px] sm:text-xs font-bold text-black/80">
          EN: {question.englishText}
        </p>
      )}
    </div>
  );
}

export default GrammarQuestionPrompt;
