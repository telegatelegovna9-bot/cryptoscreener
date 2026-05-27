"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CandlestickChart,
  Filter,
  Grid3X3,
  Puzzle,
  BellRing,
  Star,
  Settings,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { Badge, Tooltip } from "@/components/ui";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/screener", icon: Filter, label: "Screener" },
  { href: "/charts", icon: CandlestickChart, label: "Charts" },
  { href: "/heatmap", icon: Grid3X3, label: "Heatmap" },
  { href: "/patterns", icon: Puzzle, label: "Patterns" },
  { href: "/alerts", icon: BellRing, label: "Alerts", badge: 3 },
  { href: "/watchlist", icon: Star, label: "Watchlist" },
];

const bottomNavItems: NavItem[] = [
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { sidebarExpanded, setSidebarExpanded } = useAppStore();

  return (
    <nav
      className={cn(
        "fixed left-0 z-30",
        "top-[var(--topbar-h)] bottom-[var(--statusbar-h)]",
        "bg-nav-bg backdrop-blur-xl border-r border-border-default",
        "flex flex-col",
        "transition-[width] duration-200 ease-[var(--ease-glass)]"
      )}
      style={{ width: sidebarExpanded ? 220 : 64 }}
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => setSidebarExpanded(false)}
    >
      {/* ── Main Nav ── */}
      <div className="flex-1 flex flex-col gap-1 p-2 pt-3">
        {navItems.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            active={pathname === item.href}
            expanded={sidebarExpanded}
          />
        ))}
      </div>

      {/* ── Bottom Nav ── */}
      <div className="flex flex-col gap-1 p-2 pb-3 border-t border-border-default">
        {bottomNavItems.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            active={pathname === item.href}
            expanded={sidebarExpanded}
          />
        ))}
      </div>
    </nav>
  );
}

/* ── Nav Item ── */
function NavItemComponent({
  item,
  active,
  expanded,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg transition-all duration-150 group",
        "h-10 px-3",
        active
          ? "bg-primary-glow text-foreground"
          : "text-foreground-muted hover:text-foreground hover:bg-bg-hover"
      )}
    >
      {/* ── Active indicator ── */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
      )}

      {/* ── Icon ── */}
      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
        <Icon
          className={cn(
            "h-[18px] w-[18px] transition-colors",
            active ? "text-primary" : "text-foreground-secondary group-hover:text-foreground-muted"
          )}
        />
      </div>

      {/* ── Label (animated) ── */}
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-medium truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* ── Badge ── */}
      {item.badge !== undefined && (
        <Badge
          variant="bearish"
          size="sm"
          className={cn(
            "shrink-0",
            expanded ? "ml-auto" : "absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1"
          )}
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );

  // When collapsed, wrap in tooltip
  if (!expanded) {
    return (
      <Tooltip content={item.label} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
