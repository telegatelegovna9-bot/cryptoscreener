// ============================================
// Settings Store (Zustand with persist)
// User preferences and chart settings
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exchange, Timeframe } from '@/types/shared';

interface SettingsState {
  theme: 'dark' | 'light';
  defaultExchange: Exchange;
  defaultTimeframe: Timeframe;
  defaultChartCount: number;
  notifications: {
    sound: boolean;
    desktop: boolean;
    telegram: boolean;
  };
  chart: {
    candleStyle: 'candles' | 'line' | 'area';
    showVolume: boolean;
    showLiquidity: boolean;
    showPatterns: boolean;
    showOverlays: boolean;
  };

  setTheme: (theme: 'dark' | 'light') => void;
  setDefaultExchange: (exchange: Exchange) => void;
  setDefaultTimeframe: (timeframe: Timeframe) => void;
  setDefaultChartCount: (count: number) => void;
  setNotificationSound: (enabled: boolean) => void;
  setNotificationDesktop: (enabled: boolean) => void;
  setNotificationTelegram: (enabled: boolean) => void;
  setCandleStyle: (style: 'candles' | 'line' | 'area') => void;
  setShowVolume: (show: boolean) => void;
  setShowLiquidity: (show: boolean) => void;
  setShowPatterns: (show: boolean) => void;
  setShowOverlays: (show: boolean) => void;
  toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      defaultExchange: Exchange.BINANCE,
      defaultTimeframe: Timeframe.H1,
      defaultChartCount: 4,
      notifications: {
        sound: false,
        desktop: false,
        telegram: false,
      },
      chart: {
        candleStyle: 'candles',
        showVolume: true,
        showLiquidity: false,
        showPatterns: false,
        showOverlays: false,
      },

      setTheme: (theme) => set({ theme }),

      setDefaultExchange: (exchange) => set({ defaultExchange: exchange }),

      setDefaultTimeframe: (timeframe) => set({ defaultTimeframe: timeframe }),

      setDefaultChartCount: (count) => set({ defaultChartCount: count }),

      setNotificationSound: (enabled) =>
        set((state) => ({
          notifications: { ...state.notifications, sound: enabled },
        })),

      setNotificationDesktop: (enabled) =>
        set((state) => ({
          notifications: { ...state.notifications, desktop: enabled },
        })),

      setNotificationTelegram: (enabled) =>
        set((state) => ({
          notifications: { ...state.notifications, telegram: enabled },
        })),

      setCandleStyle: (style) =>
        set((state) => ({
          chart: { ...state.chart, candleStyle: style },
        })),

      setShowVolume: (show) =>
        set((state) => ({
          chart: { ...state.chart, showVolume: show },
        })),

      setShowLiquidity: (show) =>
        set((state) => ({
          chart: { ...state.chart, showLiquidity: show },
        })),

      setShowPatterns: (show) =>
        set((state) => ({
          chart: { ...state.chart, showPatterns: show },
        })),

      setShowOverlays: (show) =>
        set((state) => ({
          chart: { ...state.chart, showOverlays: show },
        })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'crypto-screener-settings',
    },
  ),
);
