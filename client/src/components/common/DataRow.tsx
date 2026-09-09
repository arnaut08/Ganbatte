import type { ReactNode } from 'react';

type DataRowProps = {
  accentColor?: string;
  left: ReactNode;
  right: ReactNode;
  className?: string;
};

export default function DataRow({ accentColor, left, right, className = '' }: DataRowProps) {
  return (
    <div
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
      className={`flex flex-col justify-between gap-3 border-2 border-black border-l-8 bg-[#1f2637] p-3.5 text-white shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] sm:flex-row sm:items-center sm:p-4 sm:shadow-[4px_4px_0px_0px_#000] ${className}`}
    >
      <div className="min-w-0 space-y-1.5">{left}</div>
      <div className="flex items-center justify-between border-t-2 border-white/10 pt-2 sm:justify-end sm:gap-4 sm:border-t-0 sm:pt-0">
        {right}
      </div>
    </div>
  );
}