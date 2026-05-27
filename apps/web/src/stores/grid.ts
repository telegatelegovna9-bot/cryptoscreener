// ============================================
// Grid Store (Zustand)
// Chart grid layout management
// ============================================

import { create } from 'zustand';
import { Exchange, Timeframe } from '@/types/shared';

interface GridCell {
  symbol: string;
  exchange: Exchange;
  timeframe: Timeframe;
}

interface GridState {
  cols: number;
  rows: number;
  cells: GridCell[];
  setGridSize: (cols: number, rows: number) => void;
  setCell: (index: number, cell: GridCell) => void;
}

const DEFAULT_CELLS: GridCell[] = [
  { symbol: 'BTC/USDT', exchange: Exchange.BINANCE, timeframe: Timeframe.H1 },
  { symbol: 'ETH/USDT', exchange: Exchange.BINANCE, timeframe: Timeframe.H1 },
  { symbol: 'SOL/USDT', exchange: Exchange.BINANCE, timeframe: Timeframe.H1 },
  { symbol: 'XRP/USDT', exchange: Exchange.BINANCE, timeframe: Timeframe.H1 },
];

export const useGridStore = create<GridState>((set) => ({
  cols: 2,
  rows: 2,
  cells: DEFAULT_CELLS,

  setGridSize: (cols, rows) =>
    set((state) => {
      const total = cols * rows;
      const cells = [...state.cells];
      while (cells.length < total) {
        cells.push({
          symbol: 'BTC/USDT',
          exchange: Exchange.BINANCE,
          timeframe: Timeframe.H1,
        });
      }
      return { cols, rows, cells: cells.slice(0, total) };
    }),

  setCell: (index, cell) =>
    set((state) => {
      const cells = [...state.cells];
      if (index >= 0 && index < cells.length) {
        cells[index] = cell;
      }
      return { cells };
    }),
}));
