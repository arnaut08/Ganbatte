import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

function BackButton({ onClick, className, label = 'Back', ...props }) {
  return (
    <Button
      type="button"
      variant="neutral"
      size="icon"
      onClick={onClick}
      className={cn(
        'h-9 w-9 rounded-none border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000]',
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
