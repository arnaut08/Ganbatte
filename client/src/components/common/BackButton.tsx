import type { ButtonHTMLAttributes, ComponentType, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

type BackButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

type LegacyButtonProps = BackButtonProps & {
  children?: ReactNode;
  size?: string;
  variant?: string;
};

const LegacyButton = Button as unknown as ComponentType<LegacyButtonProps>;

function BackButton({ onClick, className, label = 'Back', ...props }: BackButtonProps) {
  return (
    <LegacyButton
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
    </LegacyButton>
  );
}

export default BackButton;
