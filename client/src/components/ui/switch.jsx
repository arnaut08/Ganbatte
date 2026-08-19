import * as React from 'react';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef(({ className, checked = false, onCheckedChange, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={checked}
    data-state={checked ? 'checked' : 'unchecked'}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      checked ? 'bg-primary' : 'bg-input',
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        'pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform',
        checked ? 'translate-x-3' : 'translate-x-0',
      )}
      style={{
        backgroundColor: 'white',
      }}
    />
  </button>
));

Switch.displayName = 'Switch';

export { Switch };
