import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { FormEventHandler, ReactNode } from 'react';

type LegacyProps = { children?: ReactNode;[key: string]: unknown };

const LegacyButton = Button as unknown as (props: LegacyProps) => JSX.Element;

type RoomSetupVariant = 'host' | 'client';
type SubmitTone = 'host' | 'gauntlet' | 'client';

export type RoomSetupCardProps = {
  variant: RoomSetupVariant;
  menuOpen?: boolean;
  badgeLabel: string;
  metaLabel: string;
  title: string;
  description: string;
  watermark: string;
  submitTone: SubmitTone;
  submitLabel: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitDisabled: boolean;
  children: ReactNode;
};

const variantStyles = {
  host: {
    badge: 'bg-[#FFDE59]',
    watermark: 'rgba(255, 222, 89, 0.18)',
    card: (menuOpen: boolean) =>
      `group relative flex flex-col justify-between border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-3.5 sm:p-6 shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150 ${menuOpen ? 'z-30 overflow-visible' : 'z-10 overflow-visible'}`,
  },
  client: {
    badge: 'bg-[#A3E636]',
    watermark: 'rgba(163, 230, 54, 0.18)',
    card: () =>
      'group relative z-10 flex flex-col justify-between overflow-hidden border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-3.5 sm:p-6 shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150',
  },
} as const;

const submitStyles: Record<SubmitTone, string> = {
  host: 'bg-white hover:bg-[#FFDE59]',
  gauntlet: 'bg-[#FF6B6B] hover:bg-white',
  client: 'bg-white hover:bg-[#A3E636]',
};

export default function RoomSetupCard({
  variant,
  menuOpen = false,
  badgeLabel,
  metaLabel,
  title,
  description,
  watermark,
  submitTone,
  submitLabel,
  onSubmit,
  submitDisabled,
  children,
}: RoomSetupCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={styles.card(menuOpen)}>
      {variant === 'host' ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span
            className="absolute -bottom-3 -right-2 sm:-bottom-6 sm:-right-3 select-none font-mono text-[95px] sm:text-[135px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
            style={{ WebkitTextStroke: `2px ${styles.watermark}` }}
            aria-hidden="true"
          >
            {watermark}
          </span>
        </div>
      ) : (
        <span
          className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-6 sm:-right-3 select-none font-mono text-[95px] sm:text-[135px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
          style={{ WebkitTextStroke: `2px ${styles.watermark}` }}
          aria-hidden="true"
        >
          {watermark}
        </span>
      )}

      {/* CHANGED to z-20 to win the stacking context against the form below */}
      <div className="relative z-20 space-y-3.5 sm:space-y-5">
        <div>
          <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
            <span className={`border-2 border-black ${styles.badge} px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[11px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-none`}>
              {badgeLabel}
            </span>
            <span className="font-mono text-[9px] sm:text-xs font-bold text-neutral-400">
              {metaLabel}
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
            {title}
          </h3>
          <p className="mt-1 text-xs sm:text-sm font-medium text-neutral-300 leading-snug">
            {description}
          </p>
        </div>

        {children}
      </div>

      <form onSubmit={onSubmit} className="relative z-10 mt-4 sm:mt-6">
        <LegacyButton
          type="submit"
          disabled={submitDisabled}
          className={`w-full cursor-pointer border-2 border-black py-2.5 sm:py-5 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${submitStyles[submitTone]}`}
        >
          {submitLabel}
        </LegacyButton>
      </form>
    </Card>
  );
}