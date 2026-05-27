'use client';

import { useRef, useMemo, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTickerStore } from '@/stores/ticker';
import { useCoinDetailStore } from '@/stores/coin-detail';
import { useWatchlistStore } from '@/stores/watchlist';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Exchange } from '@/types/shared';
import type { Ticker } from '@/types/shared';

const ROW_HEIGHT = 40;
const OVERSCAN = 10;

const volumeFilters = [
  { label: '$100K', value: 100_000 },
  { label: '$1M', value: 1_000_000 },
  { label: '$10M', value: 10_000_000 },
  { label: '$100M', value: 100_000_000 },
];

const allExchanges: Exchange[] = [
  Exchange.BINANCE, Exchange.BYBIT, Exchange.OKX, Exchange.KUCOIN,
  Exchange.BITGET, Exchange.GATE, Exchange.MEXC, Exchange.HYPERLIQUID, Exchange.COINBASE,
];

type SortField = 'symbol' | 'price' | 'priceChangePercent24h' | 'quoteVolume24h' | 'trades24h' | 'spread';

const columns: { key: SortField; label: string; align?: 'right' }[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'priceChangePercent24h', label: '24h%', align: 'right' },
  { key: 'quoteVolume24h', label: 'Volume', align: 'right' },
  { key: 'trades24h', label: 'Trades', align: 'right' },
  { key: 'spread', label: 'Spread', align: 'right' },
];

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
  return vol.toFixed(0);
}

export function CoinList() {
  const parentRef = useRef<HTMLDivElement>(null);
  const tickers = useTickerStore((s) => s.tickers);
  const marketType = useTickerStore((s) => s.marketType);
  const setMarketType = useTickerStore((s) => s.setMarketType);

  const openCoinDetail = useCoinDetailStore((s) => s.openCoinDetail);
  const isInAnyWatchlist = useWatchlistStore((s) => s.isInAnyWatchlist);
  const addSymbol = useWatchlistStore((s) => s.addSymbol);
  const removeSymbol = useWatchlistStore((s) => s.removeSymbol);
  const activeWatchlistId = useWatchlistStore((s) => s.activeWatchlistId);

  // Local filter/sort state (store no longer handles this)
  const [search, setSearch] = useState('');
  const [minVolume, setMinVolume] = useState(0);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortField>('quoteVolume24h');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleExchange = useCallback((exchange: string) => {
    setSelectedExchanges((prev) =>
      prev.includes(exchange) ? prev.filter((e) => e !== exchange) : [...prev, exchange]
    );
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDirection('desc');
      return field;
    });
  }, []);

  const filteredTickers = useMemo(() => {
    let result = Array.from(tickers.values());

    // Market type filter
    if (marketType === 'spot') {
      result = result.filter((t) => t.marketType === 'spot');
    } else {
      result = result.filter((t) => t.marketType === 'futures' || t.marketType === 'perpetual');
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.symbol.toLowerCase().includes(q) ||
          t.normalizedSymbol.toLowerCase().includes(q)
      );
    }

    // Exchange filter
    if (selectedExchanges.length > 0) {
      result = result.filter((t) => selectedExchanges.includes(t.exchange));
    }

    // Volume filter
    if (minVolume > 0) {
      result = result.filter((t) => t.quoteVolume24h >= minVolume);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy] ?? 0;
      const bVal = (b as unknown as Record<string, unknown>)[sortBy] ?? 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });

    return result;
  }, [tickers, marketType, search, selectedExchanges, minVolume, sortBy, sortDirection]);

  const virtualizer = useVirtualizer({
    count: filteredTickers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const handleRowClick = useCallback(
    (ticker: Ticker) => {
      openCoinDetail(ticker.normalizedSymbol, ticker.exchange as Exchange);
    },
    [openCoinDetail]
  );

  const handleToggleWatchlist = useCallback(
    (e: React.MouseEvent, ticker: Ticker) => {
      e.stopPropagation();
      if (!activeWatchlistId) return;
      if (isInAnyWatchlist(ticker.normalizedSymbol)) {
        removeSymbol(activeWatchlistId, ticker.normalizedSymbol);
      } else {
        addSymbol(activeWatchlistId, ticker.normalizedSymbol);
      }
    },
    [activeWatchlistId, isInAnyWatchlist, addSymbol, removeSymbol]
  );

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border">
        {/* Market type tabs */}
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
          {(['spot', 'futures'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMarketType(t)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                marketType === t
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground-muted hover:text-foreground'
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <Input
          icon={Search}
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 h-7 text-xs"
        />

        {/* Volume filter */}
        <select
          value={minVolume}
          onChange={(e) => setMinVolume(Number(e.target.value))}
          className="bg-input border border-border rounded-lg text-xs text-foreground h-7 px-2"
        >
          <option value={0}>Min volume</option>
          {volumeFilters.map((vf) => (
            <option key={vf.value} value={vf.value}>
              {vf.label}
            </option>
          ))}
        </select>

        {/* Exchange filters */}
        <div className="flex gap-0.5 overflow-x-auto">
          {allExchanges.map((ex) => (
            <Button
              key={ex}
              size="sm"
              variant={selectedExchanges.includes(ex) ? 'default' : 'ghost'}
              onClick={() => toggleExchange(ex)}
              className="h-7 text-[10px] px-1.5"
            >
              {ex.slice(0, 4).toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1.5 border-b border-border bg-muted/30 text-[10px] text-foreground-muted font-medium">
        <div className="w-7 shrink-0" />
        {columns.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={cn(
              'flex-1 text-left cursor-pointer hover:text-foreground transition-colors',
              col.align === 'right' && 'text-right',
              sortBy === col.key && 'text-primary'
            )}
          >
            {col.label}
            {sortBy === col.key && (
              <span className="ml-0.5">{sortDirection === 'asc' ? '\u2191' : '\u2193'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Virtual list */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const ticker = filteredTickers[virtualRow.index];
            if (!ticker) return null;
            const isUp = ticker.priceChangePercent24h >= 0;
            const watched = isInAnyWatchlist(ticker.normalizedSymbol);

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full flex items-center px-3 hover:bg-glass-strong transition-colors border-b border-border/50 cursor-pointer"
                style={{
                  height: `${ROW_HEIGHT}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Star */}
                <button
                  className="w-7 shrink-0 flex items-center justify-center"
                  onClick={(e) => handleToggleWatchlist(e, ticker)}
                >
                  <Star
                    className={cn(
                      'h-3.5 w-3.5',
                      watched
                        ? 'fill-warning text-warning'
                        : 'text-foreground-muted'
                    )}
                  />
                </button>

                {/* Symbol */}
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => handleRowClick(ticker)}
                >
                  <span className="text-xs font-medium text-foreground truncate block">
                    {ticker.normalizedSymbol}
                  </span>
                </button>

                {/* Price */}
                <span className="flex-1 text-right text-xs text-foreground tabular-nums">
                  {formatPrice(ticker.price)}
                </span>

                {/* 24h% */}
                <span
                  className={cn(
                    'flex-1 text-right text-xs font-medium tabular-nums',
                    isUp ? 'text-bullish' : 'text-bearish'
                  )}
                >
                  {isUp ? '+' : ''}
                  {ticker.priceChangePercent24h.toFixed(2)}%
                </span>

                {/* Volume */}
                <span className="flex-1 text-right text-xs text-foreground-muted tabular-nums">
                  {formatVolume(ticker.quoteVolume24h)}
                </span>

                {/* Trades */}
                <span className="flex-1 text-right text-xs text-foreground-muted tabular-nums">
                  {ticker.trades24h?.toLocaleString() ?? '--'}
                </span>

                {/* Spread */}
                <span className="flex-1 text-right text-xs text-foreground-muted tabular-nums">
                  {ticker.spread != null ? ticker.spread.toFixed(4) : '--'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
