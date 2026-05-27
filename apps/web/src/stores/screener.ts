// ============================================
// Screener Store (Zustand)
// Filters, search, sorting for screener
// ============================================

import { create } from 'zustand';
import { Exchange, Ticker } from '@/types/shared';

interface ScreenerFilter {
  field: string;
  operator: string;
  value: number | [number, number];
}

interface ScreenerState {
  filters: ScreenerFilter[];
  search: string;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  exchanges: Exchange[];
  results: Ticker[];
  loading: boolean;

  addFilter: (filter: ScreenerFilter) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  setSearch: (s: string) => void;
  setSortBy: (field: string) => void;
  setSortDirection: (dir: 'asc' | 'desc') => void;
  setExchanges: (exchanges: Exchange[]) => void;
  setResults: (results: Ticker[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useScreenerStore = create<ScreenerState>((set) => ({
  filters: [],
  search: '',
  sortBy: 'priceChangePercent24h',
  sortDirection: 'desc',
  exchanges: [Exchange.BINANCE],
  results: [],
  loading: false,

  addFilter: (filter) =>
    set((state) => ({ filters: [...state.filters, filter] })),

  removeFilter: (index) =>
    set((state) => ({
      filters: state.filters.filter((_, i) => i !== index),
    })),

  clearFilters: () => set({ filters: [] }),

  setSearch: (s) => set({ search: s }),

  setSortBy: (field) => set({ sortBy: field }),

  setSortDirection: (dir) => set({ sortDirection: dir }),

  setExchanges: (exchanges) => set({ exchanges }),

  setResults: (results) => set({ results }),

  setLoading: (loading) => set({ loading }),
}));
