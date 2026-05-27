// ============================================
// Watchlist Store (Zustand with persist)
// User-created symbol watchlists
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

interface WatchlistState {
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  addWatchlist: (name: string) => void;
  removeWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string) => void;
  addSymbol: (watchlistId: string, symbol: string) => void;
  removeSymbol: (watchlistId: string, symbol: string) => void;
  setActiveWatchlist: (id: string) => void;
  isInAnyWatchlist: (symbol: string) => boolean;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DEFAULT_WATCHLIST: Watchlist = {
  id: 'favorites',
  name: 'Favorites',
  symbols: ['BTC/USDT', 'ETH/USDT'],
};

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlists: [DEFAULT_WATCHLIST],
      activeWatchlistId: 'favorites',

      addWatchlist: (name) => {
        const id = generateId();
        set((state) => ({
          watchlists: [...state.watchlists, { id, name, symbols: [] }],
          activeWatchlistId: id,
        }));
      },

      removeWatchlist: (id) =>
        set((state) => {
          const watchlists = state.watchlists.filter((w) => w.id !== id);
          return {
            watchlists,
            activeWatchlistId:
              state.activeWatchlistId === id
                ? watchlists[0]?.id ?? null
                : state.activeWatchlistId,
          };
        }),

      renameWatchlist: (id, name) =>
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === id ? { ...w, name } : w,
          ),
        })),

      addSymbol: (watchlistId, symbol) =>
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === watchlistId && !w.symbols.includes(symbol)
              ? { ...w, symbols: [...w.symbols, symbol] }
              : w,
          ),
        })),

      removeSymbol: (watchlistId, symbol) =>
        set((state) => ({
          watchlists: state.watchlists.map((w) =>
            w.id === watchlistId
              ? { ...w, symbols: w.symbols.filter((s) => s !== symbol) }
              : w,
          ),
        })),

      setActiveWatchlist: (id) =>
        set({ activeWatchlistId: id }),

      isInAnyWatchlist: (symbol) =>
        get().watchlists.some((w) => w.symbols.includes(symbol)),
    }),
    {
      name: 'crypto-screener-watchlists',
    },
  ),
);
