import type { KeyboardEvent, ReactNode } from 'react';

type BrutalistCardProps = {
  accentColor: string;
  title?: ReactNode;
  badges?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  watermark?: ReactNode;
  className?: string;
};

export default function BrutalistCard({
  accentColor,
  title,
  badges,
  children,
  onClick,
  watermark,
  className = '',
}: BrutalistCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };

  return (
    <article
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ borderLeftColor: accentColor }}
      className={`group relative flex flex-col justify-between overflow-hidden border-2 border-black border-l-8 bg-[#1f2637] text-white shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {watermark}

      <div className="relative z-10">
        {badges}
        {title}
      </div>

      {children}
    </article>
  );
}