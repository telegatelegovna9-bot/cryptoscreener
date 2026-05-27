import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/* ── Card ── */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass",
          variant === "elevated" && "glass-strong",
          variant === "interactive" &&
            "glass cursor-pointer transition-all duration-150 hover:bg-bg-hover hover:border-border-hover hover:shadow-glow-primary",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

/* ── Card Header ── */
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1.5 p-4 pb-2", className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

/* ── Card Title ── */
const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

/* ── Card Description ── */
const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-xs text-foreground-muted", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

/* ── Card Content ── */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />;
  }
);
CardContent.displayName = "CardContent";

/* ── Card Footer ── */
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center p-4 pt-0", className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
