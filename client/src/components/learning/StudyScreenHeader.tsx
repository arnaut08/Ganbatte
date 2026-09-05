type StudyScreenHeaderProps = {
  onBack: () => void;
  eyebrow: string;
  title: string;
  accentClassName: string;
};

export default function StudyScreenHeader({
  onBack,
  eyebrow,
  title,
  accentClassName,
}: StudyScreenHeaderProps) {
  return (
    <header className="flex items-center gap-2.5 sm:gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
        aria-label="Return to learning modules"
      >
        <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
      </button>
      <div className="flex flex-col justify-center text-left">
        <span className={`font-mono text-[9px] font-black uppercase tracking-wider sm:text-xs ${accentClassName}`}>
          {eyebrow}
        </span>
        <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
      </div>
    </header>
  );
}
