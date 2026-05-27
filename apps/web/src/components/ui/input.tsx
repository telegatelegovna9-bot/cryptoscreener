import { type InputHTMLAttributes, forwardRef, type ElementType } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ElementType;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: Icon, ...props }, ref) => (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
      )}
      <input
        ref={ref}
        className={cn(
          'h-9 w-full bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-foreground-secondary',
          'focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary',
          'transition-colors duration-150',
          Icon ? 'pl-9 pr-3' : 'px-3',
          className
        )}
        {...props}
      />
    </div>
  )
);
Input.displayName = 'Input';

export { Input };
