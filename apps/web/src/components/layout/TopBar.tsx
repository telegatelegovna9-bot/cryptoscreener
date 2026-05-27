"use client";

import {
  Search,
  Bell,
  Star,
  Maximize2,
  Settings,
  LayoutGrid,
  Grid2X2,
  Grid3X3,
  Columns3,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { Input, Select, Button, Badge, Tooltip } from "@/components/ui";
import { cn } from "@/lib/cn";
import Link from "next/link";

/* ── Select Options ── */
const exchangeOptions = [
  { value: "binance", label: "Binance" },
  { value: "bybit", label: "Bybit" },
  { value: "okx", label: "OKX" },
  { value: "bitget", label: "Bitget" },
  { value: "gate", label: "Gate" },
];

const timeframeOptions = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
];

const gridOptions = [
  { value: "1", label: "1 Chart", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { value: "4", label: "2×2", icon: <Grid2X2 className="h-3.5 w-3.5" /> },
  { value: "6", label: "2×3", icon: <Columns3 className="h-3.5 w-3.5" /> },
  { value: "9", label: "3×3", icon: <Grid3X3 className="h-3.5 w-3.5" /> },
];

export function TopBar() {
  const { exchange, setExchange, timeframe, setTimeframe, gridCols, setGridCols } =
    useAppStore();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40",
        "h-[var(--topbar-h)] flex items-center gap-3 px-4",
        "bg-topbar-bg backdrop-blur-xl border-b border-border-default"
      )}
    >
      {/* ── Logo ── */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">CS</span>
        </div>
        <span className="text-sm font-semibold text-foreground hidden sm:block">
          Screener
        </span>
      </Link>

      {/* ── Search ── */}
      <div className="flex-1 max-w-md">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search coins... (BTC, ETH, SOL)"
          className="h-8 text-xs"
        />
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Controls ── */}
      <div className="flex items-center gap-2">
        {/* Exchange */}
        <Select
          value={exchange}
          options={exchangeOptions}
          onChange={setExchange}
          compact
          className="w-[100px]"
        />

        {/* Timeframe */}
        <Select
          value={timeframe}
          options={timeframeOptions}
          onChange={setTimeframe}
          compact
          className="w-[70px]"
        />

        {/* Grid */}
        <Select
          value={String(gridCols)}
          options={gridOptions}
          onChange={(v) => setGridCols(Number(v))}
          compact
          className="w-[90px]"
        />

        {/* Divider */}
        <div className="h-5 w-px bg-border-default mx-1" />

        {/* Alerts */}
        <Tooltip content="Alerts" side="bottom">
          <Button variant="ghost" size="icon-sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge
              variant="bearish"
              size="sm"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1"
            >
              3
            </Badge>
          </Button>
        </Tooltip>

        {/* Watchlist */}
        <Tooltip content="Watchlist" side="bottom">
          <Link href="/watchlist">
            <Button variant="ghost" size="icon-sm">
              <Star className="h-4 w-4" />
            </Button>
          </Link>
        </Tooltip>

        {/* Fullscreen */}
        <Tooltip content="Fullscreen" side="bottom">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </Tooltip>

        {/* Settings */}
        <Tooltip content="Settings" side="bottom">
          <Link href="/settings">
            <Button variant="ghost" size="icon-sm">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </Tooltip>
      </div>
    </header>
  );
}
