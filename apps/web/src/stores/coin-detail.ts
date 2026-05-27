// ============================================
// Coin Detail Store (Zustand)
// Controls the coin detail panel visibility
// ============================================

import { create } from 'zustand';
import { Exchange, Timeframe } from '@/types/shared';

interface CoinDetailState {
  isOpen: boolean;
  symbol: string;
  exchange: Exchange;
  timeframe: Timeframe;
  openCoinDetail: (symbol: string, exchange: Exchange, timeframe?: Timeframe) => void;
  closeCoinDetail: () => void;
}

export const useCoinDetailStore = create<CoinDetailState>((set) => ({
  isOpen: false,
  symbol: '',
  exchange: Exchange.BINANCE,
  timeframe: Timeframe.H1,

  openCoinDetail: (symbol, exchange, timeframe) =>
    set({
      isOpen: true,
      symbol,
      exchange,
      timeframe: timeframe ?? Timeframe.H1,
    }),

  closeCoinDetail: () =>
    set({ isOpen: false }),
}));
