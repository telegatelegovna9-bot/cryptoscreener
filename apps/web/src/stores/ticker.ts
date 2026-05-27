// ============================================
// Ticker Store (Zustand)
// Manages real-time ticker data
// ============================================

import { create } from 'zustand';
import { Exchange, Ticker } from '@crypto-screener/shared';

interface TickerState {
  tickers: Map<string, Ticker>;
  selectedExchange: Exchange;
  marketType: 'spot' | 'futures';
  loading: boolean;
  setTickers: (tickers: Ticker[]) => void;
  updateTicker: (ticker: Ticker) => void;
  setSelectedExchange: (exchange: Exchange) => void;
  setMarketType: (type: 'spot' | 'futures') => void;
  setLoading: (loading: boolean) => void;
  getTopGainers: (limit?: number) => Ticker[];
  getTopLosers: (limit?: number) => Ticker[];
}

export const useTickerStore = create<TickerState>((set, get) => ({
  tickers: new Map<string, Ticker>(),
  selectedExchange: Exchange.BINANCE,
  marketType: 'spot',
  loading: false,

  setTickers: (tickers: Ticker[]) =>
    set(() => {
      const map = new Map<string, Ticker>();
      for (const ticker of tickers) {
        const key = `${ticker.exchange}:${ticker.symbol}`;
        map.set(key, ticker);
      }
      return { tickers: map };
    }),

  updateTicker: (ticker: Ticker) =>
    set((state) => {
      const newMap = new Map(state.tickers);
      const key = `${ticker.exchange}:${ticker.symbol}`;
      newMap.set(key, ticker);
      return { tickers: newMap };
    }),

  setSelectedExchange: (exchange: Exchange) =>
    set({ selectedExchange: exchange }),

  setMarketType: (type: 'spot' | 'futures') =>
    set({ marketType: type }),

  setLoading: (loading: boolean) =>
    set({ loading }),

  getTopGainers: (limit = 10) => {
    const all = Array.from(get().tickers.values());
    return all
      .filter((t) => t.priceChangePercent24h > 0)
      .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
      .slice(0, limit);
  },

  getTopLosers: (limit = 10) => {
    const all = Array.from(get().tickers.values());
    return all
      .filter((t) => t.priceChangePercent24h < 0)
      .sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h)
      .slice(0, limit);
  },
}));
