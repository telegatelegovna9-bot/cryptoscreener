import { create } from "zustand";

interface AppState {
  /* ── Sidebar ── */
  sidebarExpanded: boolean;
  setSidebarExpanded: (v: boolean) => void;

  /* ── Exchange ── */
  exchange: string;
  setExchange: (v: string) => void;

  /* ── Timeframe ── */
  timeframe: string;
  setTimeframe: (v: string) => void;

  /* ── Grid layout ── */
  gridCols: number;
  setGridCols: (v: number) => void;

  /* ── Market type ── */
  marketType: "spot" | "futures";
  setMarketType: (v: "spot" | "futures") => void;

  /* ── Connection ── */
  wsConnected: boolean;
  latency: number;
  setWsConnected: (v: boolean) => void;
  setLatency: (v: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarExpanded: false,
  setSidebarExpanded: (v) => set({ sidebarExpanded: v }),

  exchange: "binance",
  setExchange: (v) => set({ exchange: v }),

  timeframe: "1h",
  setTimeframe: (v) => set({ timeframe: v }),

  gridCols: 4,
  setGridCols: (v) => set({ gridCols: v }),

  marketType: "spot",
  setMarketType: (v) => set({ marketType: v }),

  wsConnected: false,
  latency: 0,
  setWsConnected: (v) => set({ wsConnected: v }),
  setLatency: (v) => set({ latency: v }),
}));
