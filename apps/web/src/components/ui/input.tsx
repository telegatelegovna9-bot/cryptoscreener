import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, suffix, type = "text", ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-foreground-secondary pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-lg border border-border-default bg-bg-surface px-3 text-sm text-foreground",
            "placeholder:text-foreground-secondary",
            "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
            "transition-all duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon && "pl-9",
            suffix && "pr-9",
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 text-foreground-secondary">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
