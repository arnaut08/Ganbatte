type FlameIconProps = {
  className?: string;
  /**
   * Convenience color switch: `true` lights the flame yellow (#FFDE59),
   * `false` dims it to muted grey. Omit to control the color entirely via
   * `className` (e.g. inside badges with their own active/inactive palette).
   */
  active?: boolean;
};

function FlameIcon({ className = 'h-3.5 w-3.5', active }: FlameIconProps) {
  const activeColorClass =
    active === undefined ? '' : active ? 'text-[#FF6B6B]' : 'text-neutral-500';

  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${activeColorClass} ${className}`.trim()}
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

export { FlameIcon };

