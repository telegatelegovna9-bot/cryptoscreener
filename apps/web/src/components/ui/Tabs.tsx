"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Tabs({
  tabs,
  activeTab: controlledTab,
  onChange,
  className,
  size = "md",
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(tabs[0]?.id);
  const active = controlledTab ?? internalTab;

  function handleSelect(tabId: string) {
    setInternalTab(tabId);
    onChange?.(tabId);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 border-b border-border-default",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelect(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 font-medium transition-all duration-150 cursor-pointer",
              "border-b-2 -mb-px",
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground hover:border-border-hover"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive
                    ? "bg-primary-glow text-primary"
                    : "bg-bg-surface text-foreground-secondary"
                )}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <div className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
