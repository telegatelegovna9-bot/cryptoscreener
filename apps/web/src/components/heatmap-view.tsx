'use client';

import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/cn';
import type { LiquidityHeatmapData, LiquidityLevel } from '@/types/shared';

interface HeatmapViewProps {
  symbol?: string;
  exchange?: string;
  className?: string;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
}

function formatQty(qty: number): string {
  if (qty >= 1e6) return `${(qty / 1e6).toFixed(2)}M`;
  if (qty >= 1e3) return `${(qty / 1e3).toFixed(1)}K`;
  return qty.toFixed(2);
}

export function HeatmapView({
  symbol = 'BTCUSDT',
  exchange = 'binance',
  className,
}: HeatmapViewProps) {
  const [data, setData] = useState<LiquidityHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/heatmap/${symbol}?exchange=${exchange}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json.data ?? json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [symbol, exchange]);

  const { maxQty, bids, asks } = useMemo(() => {
    const levels = data?.levels ?? [];
    const bidsList = levels
      .filter((l) => l.side === 'bid')
      .sort((a, b) => b.price - a.price);
    const asksList = levels
      .filter((l) => l.side === 'ask')
      .sort((a, b) => a.price - b.price);
    const maxQ = Math.max(...levels.map((l) => l.quantity), 1);
    return { maxQty: maxQ, bids: bidsList, asks: asksList };
  }, [data]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-full text-foreground-muted text-sm', className)}>
        Loading heatmap...
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full text-bearish text-sm', className)}>
        {error}
      </div>
    );
  }

  const allLevels = [...bids, ...asks];
  if (allLevels.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-foreground-muted text-sm', className)}>
        No liquidity data available.
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          Liquidity Heatmap — {symbol}
        </span>
        <span className="text-xs text-foreground-muted">{exchange.toUpperCase()}</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-1.5 text-[10px] text-foreground-muted border-b border-border">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-bullish/60" /> Bid
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-bearish/60" /> Ask
        </span>
        <span>Block width = relative quantity</span>
      </div>

      {/* Heatmap grid */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="flex flex-col-reverse gap-px">
          {/* Ask levels (reversed so lowest ask is at bottom, closest to bids) */}
          {asks.map((level, i) => (
            <LevelRow
              key={`ask-${i}`}
              level={level}
              maxQty={maxQty}
              side="ask"
            />
          ))}

          {/* Separator */}
          <div className="h-px bg-foreground-muted/30 my-1" />

          {/* Bid levels */}
          {bids.map((level, i) => (
            <LevelRow
              key={`bid-${i}`}
              level={level}
              maxQty={maxQty}
              side="bid"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function LevelRow({
  level,
  maxQty,
  side,
}: {
  level: LiquidityLevel;
  maxQty: number;
  side: 'bid' | 'ask';
}) {
  const widthPct = Math.max(5, (level.quantity / maxQty) * 100);
  const isBid = side === 'bid';
  const typeLabel =
    level.type !== 'limit'
      ? level.type.charAt(0).toUpperCase() + level.type.slice(1)
      : null;

  return (
    <div className="flex items-center gap-2 h-7 group">
      {/* Price */}
      <span className="w-24 text-right text-xs tabular-nums text-foreground-muted shrink-0">
        {formatPrice(level.price)}
      </span>

      {/* Bar */}
      <div className="flex-1 relative h-5">
        <div
          className={cn(
            'h-full rounded-sm transition-all duration-200',
            isBid ? 'bg-bullish/40 hover:bg-bullish/60' : 'bg-bearish/40 hover:bg-bearish/60'
          )}
          style={{ width: `${widthPct}%` }}
        />
        {typeLabel && (
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity">
            {typeLabel}
          </span>
        )}
      </div>

      {/* Quantity */}
      <span className="w-16 text-right text-xs tabular-nums text-foreground-muted shrink-0">
        {formatQty(level.quantity)}
      </span>
    </div>
  );
}
