import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';

const alertVariants = cva(
  cn(
    'relative w-full rounded-lg border p-4',
    '[&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4',
    'text-sm',
    '[&.text-muted-foreground]:text-foreground',
  ),
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 bg-destructive/10 text-destructive-foreground',
        success: 'border-green-500/50 bg-green-500/10 text-green-400',
        warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
