import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-bg-surface text-foreground-muted border border-border-default",
        primary: "bg-primary-glow text-primary border border-primary/20",
        bullish:
          "bg-bullish-bg text-bullish border border-bullish/15",
        bearish:
          "bg-bearish-bg text-bearish border border-bearish/15",
        warning:
          "bg-warning-bg text-warning border border-warning/15",
        accent: "bg-primary/20 text-primary-hover border border-primary/25",
      },
      size: {
        sm: "h-5 px-1.5 text-[10px] rounded",
        md: "h-6 px-2 text-xs rounded-md",
        lg: "h-7 px-2.5 text-xs rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
