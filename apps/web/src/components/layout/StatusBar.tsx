"use client";

import { Wifi, WifiOff, Clock, Activity } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { cn } from "@/lib/cn";

export function StatusBar() {
  const { wsConnected, latency, exchange } = useAppStore();

  return (
    <footer
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "h-[var(--statusbar-h)] flex items-center gap-4 px-4",
        "bg-statusbar-bg backdrop-blur-xl border-t border-border-default",
        "text-[11px] text-foreground-secondary font-mono tabular-nums"
      )}
    >
      {/* ── Connection Status ── */}
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "status-dot",
            wsConnected ? "connected" : "disconnected"
          )}
        />
        <span>{wsConnected ? "WS Connected" : "WS Disconnected"}</span>
      </div>

      {/* ── Exchange ── */}
      <div className="flex items-center gap-1.5">
        <Activity className="h-3 w-3" />
        <span>Exchange: {exchange.charAt(0).toUpperCase() + exchange.slice(1)}</span>
      </div>

      {/* ── Latency ── */}
      <div className="flex items-center gap-1.5">
        <Wifi className="h-3 w-3" />
        <span>
          Latency:{" "}
          <span
            className={cn(
              latency < 50
                ? "text-bullish"
                : latency < 150
                ? "text-warning"
                : "text-bearish"
            )}
          >
            {latency}ms
          </span>
        </span>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Time ── */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        <CurrentTime />
      </div>
    </footer>
  );
}

/* ── Current Time ── */
function CurrentTime() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return <span>{time}</span>;
}
