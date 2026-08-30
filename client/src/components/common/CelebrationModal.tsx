import { useEffect } from 'react';

/** A queued celebration shown one at a time by CelebrationModal. */
export type Celebration =
  | { kind: 'streak'; count: number }
  | { kind: 'tier'; tier: string };

type CelebrationModalProps = {
  celebration: Celebration;
  onDismiss: () => void;
};

const STREAK_THEME = {
  card: 'bg-[#FFDE59]',
  label: 'DAILY GOAL MET',
  actionLabel: 'KEEP GOING →',
};

const TIER_THEME = {
  card: 'bg-[#A3E636]',
  label: 'PROMOTION EARNED',
  actionLabel: 'CLAIM RANK →',
};

/**
 * Neo-Brutalist celebration overlay with snappy scale/spring entry animation.
 * Dismiss with Enter, Escape, the confirm button, or a backdrop click.
 */
function CelebrationModal({ celebration, onDismiss }: CelebrationModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== 'Escape') return;
      event.preventDefault();
      onDismiss();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const isStreak = celebration.kind === 'streak';
  const theme = isStreak ? STREAK_THEME : TIER_THEME;
  const headline = isStreak
    ? `🔥 ${celebration.count} DAY STREAK!`
    : `RANK PROMOTION: ${celebration.tier}`;
  const message = isStreak
    ? 'You showed up again today. Every day counts — keep the chain alive!'
    : 'New rank unlocked on your Mastery Passport. Your progress is paying off!';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={headline}
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-md border-3 border-black p-5 text-black shadow-[8px_8px_0px_0px_#000] sm:p-8 duration-200 ease-out animate-in zoom-in-90 ${theme.card}`}
      >
        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-black/70 sm:text-xs">
          {theme.label}
        </span>

        <h2 className="mt-2 font-mono text-2xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
          {headline}
        </h2>

        <p className="mt-3 font-mono text-[11px] font-bold uppercase leading-snug text-black/80 sm:text-sm">
          {message}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t-2 border-black pt-4 sm:mt-6">
          <span className="hidden font-mono text-[9px] font-bold uppercase text-black/60 sm:block sm:text-[10px]">
            Enter / Esc to close
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="border-2 border-black bg-black px-4 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000] transition-all hover:bg-neutral-800 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:text-sm"
            autoFocus
          >
            {theme.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CelebrationModal;