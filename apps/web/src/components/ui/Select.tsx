"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className,
  compact,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-border-default bg-bg-surface",
          "text-sm text-foreground transition-all duration-150",
          "hover:border-border-hover hover:bg-bg-elevated",
          "focus:outline-none focus:ring-2 focus:ring-primary/40",
          compact ? "h-8 px-2.5 text-xs" : "h-9 px-3"
        )}
      >
        {selected?.icon && (
          <span className="text-foreground-muted">{selected.icon}</span>
        )}
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 text-foreground-secondary transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full left-0 z-50 mt-1 min-w-full",
            "glass-strong rounded-lg p-1 shadow-glass-lg",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
                "transition-colors duration-100 cursor-pointer",
                option.value === value
                  ? "bg-primary-glow text-primary"
                  : "text-foreground-muted hover:text-foreground hover:bg-bg-hover"
              )}
            >
              {option.icon && <span>{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
