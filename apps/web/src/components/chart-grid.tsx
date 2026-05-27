'use client';

import { cn } from '@/lib/cn';
import { useGridStore } from '@/stores/grid';
import { useCoinDetailStore } from '@/stores/coin-detail';
import { useTickerStore } from '@/stores/ticker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TradingChart } from '@/components/trading-chart';
import { Timeframe } from '@/types/shared';

const gridPresets = [
  { label: '1', cols: 1, rows: 1 },
  { label: '4', cols: 2, rows: 2 },
  { label: '6', cols: 3, rows: 2 },
  { label: '9', cols: 3, rows: 3 },
];

const timeframes: Timeframe[] = [
  Timeframe.M1, Timeframe.M5, Timeframe.M15, Timeframe.H1,
  Timeframe.H4, Timeframe.D1, Timeframe.W1,
];

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

export function ChartGrid() {
  const { cells, cols, rows, setGridSize, setCell } = useGridStore();
  const tickers = useTickerStore((s) => s.tickers);
  const openCoinDetail = useCoinDetailStore((s) => s.openCoinDetail);

  const currentSize = cols * rows;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Grid size selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground-muted mr-2">Grid:</span>
        {gridPresets.map((preset) => {
          const size = preset.cols * preset.rows;
          return (
            <Button
              key={preset.label}
              size="sm"
              variant={currentSize === size ? 'default' : 'outline'}
              onClick={() => setGridSize(preset.cols, preset.rows)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* Grid */}
      <div
        className="flex-1 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {cells.map((cell, idx) => {
          const tickerKey = `${cell.exchange}:${cell.symbol}`;
          const ticker = tickers.get(tickerKey);
          const changePct = ticker?.priceChangePercent24h ?? 0;
          const isUp = changePct >= 0;

          return (
            <div
              key={idx}
              className="bg-card border border-border rounded-lg overflow-hidden flex flex-col"
            >
              {/* Cell header */}
              <button
                onClick={() => openCoinDetail(cell.symbol, cell.exchange, cell.timeframe)}
                className="flex items-center justify-between px-3 py-1.5 border-b border-border hover:bg-glass-strong transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {cell.symbol}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {cell.exchange.slice(0, 4).toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ticker && (
                    <>
                      <span className="text-xs text-foreground">
                        {formatPrice(ticker.price)}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isUp ? 'text-bullish' : 'text-bearish'
                        )}
                      >
                        {isUp ? '+' : ''}
                        {changePct.toFixed(2)}%
                      </span>
                    </>
                  )}
                </div>
              </button>

              {/* Chart */}
              <div className="flex-1 min-h-0">
                <TradingChart
                  symbol={cell.symbol}
                  exchange={cell.exchange}
                  timeframe={cell.timeframe}
                />
              </div>

              {/* Cell footer */}
              <div className="flex items-center justify-between px-3 py-1 border-t border-border text-[10px] text-foreground-muted">
                <span>Vol: {ticker ? formatVolume(ticker.quoteVolume24h) : '--'}</span>
                <span>Trades: {ticker?.trades24h?.toLocaleString() ?? '--'}</span>
                <span>H: {ticker ? formatPrice(ticker.high24h) : '--'}</span>
                <span>L: {ticker ? formatPrice(ticker.low24h) : '--'}</span>

                {/* Timeframe selector */}
                <select
                  value={cell.timeframe}
                  onChange={(e) =>
                    setCell(idx, { ...cell, timeframe: e.target.value as Timeframe })
                  }
                  className="bg-muted text-foreground-muted text-[10px] border border-border rounded px-1 py-0.5"
                >
                  {timeframes.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
