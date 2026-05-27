import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'destructive'
  | 'warning'
  | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary text-white',
  secondary: 'bg-muted text-foreground-muted',
  success: 'bg-bullish/15 text-bullish border border-bullish/20',
  destructive: 'bg-bearish/15 text-bearish border border-bearish/20',
  warning: 'bg-warning/15 text-warning border border-warning/20',
  outline: 'border border-border text-foreground-muted',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge, type BadgeVariant };
