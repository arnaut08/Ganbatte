import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

function BackButton({ onClick, className, label = 'Back', ...props }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={onClick}
      className={cn(
        'h-9 w-9 rounded-full border border-border bg-background/60 shadow-sm hover:bg-accent',
        className,
      )}
      aria-label={label}
      title={label}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
    </Button>
  );
}

export default BackButton;
