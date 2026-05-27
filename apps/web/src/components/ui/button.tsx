import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'default' | 'ghost' | 'outline' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-primary hover:bg-primary-hover text-white shadow-sm',
  ghost:
    'hover:bg-glass-strong text-foreground-muted hover:text-foreground',
  outline:
    'border border-border hover:bg-glass-strong text-foreground-muted hover:text-foreground',
  destructive:
    'bg-destructive hover:bg-destructive/90 text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-xs rounded-md',
  md: 'h-9 px-3 text-sm rounded-lg',
  lg: 'h-11 px-5 text-base rounded-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, type ButtonVariant, type ButtonSize };
