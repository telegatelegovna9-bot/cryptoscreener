'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCoinDetailStore } from '@/stores/coin-detail';
import { useTickerStore } from '@/stores/ticker';
import { Badge } from '@/components/ui/badge';
import { TradingChart } from '@/components/trading-chart';
import { useState } from 'react';

const tabs = [
  { key: 'chart' as const, label: 'Chart' },
  { key: 'orderbook' as const, label: 'Order Book' },
  { key: 'trades' as const, label: 'Trades' },
];

type TabKey = 'chart' | 'orderbook' | 'trades';

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
}

function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
  return `$${vol.toFixed(2)}`;
}

export function CoinDetail() {
  const { isOpen, symbol, exchange, timeframe, closeCoinDetail } = useCoinDetailStore();
  const tickers = useTickerStore((s) => s.tickers);
  const [activeTab, setActiveTab] = useState<TabKey>('chart');

  const tickerKey = `${exchange}:${symbol}`;
  const ticker = tickers.get(tickerKey);

  const changePct = ticker?.priceChangePercent24h ?? 0;
  const isUp = changePct >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-overlay"
            onClick={closeCoinDetail}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[201] w-[640px] max-w-full bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-foreground">
                  {symbol}
                </span>
                <Badge variant="outline" className="text-xs">
                  {exchange.toUpperCase()}
                </Badge>
                {ticker && (
                  <Badge
                    variant={ticker.marketType === 'spot' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {ticker.marketType}
                  </Badge>
                )}
              </div>
              <button
                onClick={closeCoinDetail}
                className="text-foreground-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-glass-strong"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Price info */}
            <div className="flex items-baseline gap-4 px-5 py-3 border-b border-border">
              <span className="text-2xl font-bold text-foreground">
                {ticker ? formatPrice(ticker.price) : '--'}
              </span>
              <span
                className={cn(
                  'text-sm font-semibold',
                  isUp ? 'text-bullish' : 'text-bearish'
                )}
              >
                {isUp ? '+' : ''}
                {changePct.toFixed(2)}%
              </span>
              <span className="text-xs text-foreground-muted">
                Vol: {ticker ? formatVolume(ticker.quoteVolume24h) : '--'}
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-border">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-5 py-2.5 text-sm font-medium transition-colors relative',
                    activeTab === tab.key
                      ? 'text-primary'
                      : 'text-foreground-muted hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="detail-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'chart' && (
                <div className="h-full min-h-[400px]">
                  <TradingChart
                    symbol={symbol}
                    exchange={exchange}
                    timeframe={timeframe}
                  />
                </div>
              )}

              {activeTab === 'orderbook' && (
                <div className="text-foreground-muted text-sm text-center py-20">
                  Order book data will be displayed here via WebSocket.
                </div>
              )}

              {activeTab === 'trades' && (
                <div className="text-foreground-muted text-sm text-center py-20">
                  Recent trades will be displayed here via WebSocket.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
