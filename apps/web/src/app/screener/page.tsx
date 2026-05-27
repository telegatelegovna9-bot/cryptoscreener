'use client';

import { useState } from 'react';
import { useTickers } from '@/hooks/use-tickers';
import { useScreenerStore } from '@/stores/screener';
import { useCoinDetailStore } from '@/stores/coin-detail';
import { Exchange, Ticker } from '@crypto-screener/shared';
import { Search, X, TrendingUp, TrendingDown, BarChart3, Activity, Zap, Droplets } from 'lucide-react';

const QUICK_FILTERS = [
  { label: 'Top Gainers', icon: TrendingUp, filter: { field: 'priceChangePercent24h', operator: 'gt', value: 3 } },
  { label: 'Top Losers', icon: TrendingDown, filter: { field: 'priceChangePercent24h', operator: 'lt', value: -3 } },
  { label: 'Top Volume', icon: BarChart3, filter: { field: 'volume24h', operator: 'gt', value: 10000000 } },
  { label: 'High Volatility', icon: Activity, filter: { field: 'spread', operator: 'gt', value: 5 } },
  { label: 'High OI', icon: Droplets, filter: { field: 'openInterest', operator: 'gt', value: 1000000 } },
  { label: 'High Funding', icon: Zap, filter: { field: 'fundingRate', operator: 'gt', value: 0.01 } },
];

const EXCHANGES: Exchange[] = [
  Exchange.BINANCE, Exchange.BYBIT, Exchange.OKX, Exchange.KUCOIN,
  Exchange.BITGET, Exchange.GATE, Exchange.MEXC,
];

export default function ScreenerPage() {
  const { data: tickers = [] } = useTickers({ exchange: Exchange.BINANCE, marketType: 'spot' });
  const { filters, search, sortBy, sortDirection, exchanges, setSearch, addFilter, removeFilter, clearFilters } = useScreenerStore();
  const openCoinDetail = useCoinDetailStore((s) => s.openCoinDetail);

  const filtered = tickers.filter((t) => {
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if (exchanges.length > 0 && !exchanges.includes(t.exchange as Exchange)) return false;
    for (const f of filters) {
      const val = (t as unknown as Record<string, unknown>)[f.field] as number;
      if (val === undefined) continue;
      if (f.operator === 'gt' && val <= (f.value as number)) return false;
      if (f.operator === 'lt' && val >= (f.value as number)) return false;
      if (f.operator === 'gte' && val < (f.value as number)) return false;
      if (f.operator === 'lte' && val > (f.value as number)) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortBy] as number;
    const bVal = (b as unknown as Record<string, unknown>)[sortBy] as number;
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Screener</h1>
          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">{sorted.length} results</span>
        </div>
        {filters.length > 0 && (
          <button onClick={clearFilters} className="text-sm text-foreground-muted hover:text-foreground flex items-center gap-1">
            <X size={14} /> Clear filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.label}
            onClick={() => addFilter(qf.filter)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-card border border-border hover:border-primary transition-colors"
          >
            <qf.icon size={14} />
            {qf.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {EXCHANGES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              const idx = exchanges.indexOf(ex);
              if (idx >= 0) exchanges.splice(idx, 1);
              else exchanges.push(ex);
            }}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              exchanges.includes(ex) ? 'bg-primary/20 border-primary text-primary' : 'bg-card border-border text-foreground-muted hover:border-primary'
            }`}
          >
            {ex.slice(0, 4)}
          </button>
        ))}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((f, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-accent/20 text-accent border border-accent/30">
              {f.field} {f.operator} {Array.isArray(f.value) ? f.value.join('-') : f.value}
              <button onClick={() => removeFilter(i)} className="ml-1 hover:text-destructive"><X size={12} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbols..."
          className="w-full pl-9 pr-4 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-foreground-muted text-left border-b border-border">
              <th className="py-2 px-3">#</th>
              <th className="py-2 px-3">Symbol</th>
              <th className="py-2 px-3">Exchange</th>
              <th className="py-2 px-3 text-right">Price</th>
              <th className="py-2 px-3 text-right">24h%</th>
              <th className="py-2 px-3 text-right">Volume</th>
              <th className="py-2 px-3 text-right">Trades</th>
              <th className="py-2 px-3 text-right">Spread</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr
                key={`${t.symbol}-${t.exchange}`}
                className="border-b border-border/50 hover:bg-card-hover cursor-pointer"
                onClick={() => openCoinDetail(t.symbol, t.exchange as Exchange)}
              >
                <td className="py-2 px-3 text-foreground-muted">{i + 1}</td>
                <td className="py-2 px-3 font-medium">{t.normalizedSymbol || t.symbol}</td>
                <td className="py-2 px-3 text-foreground-muted">{t.exchange}</td>
                <td className="py-2 px-3 text-right font-mono">${t.price?.toFixed(2)}</td>
                <td className={`py-2 px-3 text-right font-mono ${(t.priceChangePercent24h ?? 0) >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                  {(t.priceChangePercent24h ?? 0) >= 0 ? '+' : ''}{(t.priceChangePercent24h ?? 0).toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-right font-mono text-foreground-muted">${(t.volume24h ?? 0).toLocaleString()}</td>
                <td className="py-2 px-3 text-right text-foreground-muted">{(t.trades24h ?? 0).toLocaleString()}</td>
                <td className="py-2 px-3 text-right text-foreground-muted">{(t.spread ?? 0).toFixed(3)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="text-center py-12 text-foreground-muted">No results match your filters</div>
        )}
      </div>
    </div>
  );
}
