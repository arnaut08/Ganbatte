import type { ReactNode } from 'react';

type GlobalPageHeaderProps = {
  title: string;
  punchline: string;
  accentClass: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
};

export default function GlobalPageHeader({
  title,
  punchline,
  accentClass,
  onBack,
  rightSlot,
}: GlobalPageHeaderProps) {
  return (
    <header className={`flex gap-2.5 sm:gap-4 ${rightSlot ? 'flex-col sm:flex-row sm:items-center sm:justify-between' : 'items-start'}`}>
      <div className="flex min-w-0 items-start gap-2.5 sm:gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
            title="Back"
            aria-label="Back"
          >
            <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
          </button>
        )}

        <div className="min-w-0 flex flex-col justify-center text-left">
          <span className={`font-mono text-[9px] font-black uppercase tracking-wider sm:text-xs ${accentClass}`}>
            {punchline}
          </span>
          <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
        </div>
      </div>

      {rightSlot && <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:gap-2">{rightSlot}</div>}
    </header>
  );
}