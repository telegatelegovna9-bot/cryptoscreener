'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts';
import type { Exchange, Timeframe } from '@/types/shared';

interface TradingChartProps {
  symbol: string;
  exchange: Exchange;
  timeframe: Timeframe;
  className?: string;
}

export function TradingChart({ symbol, exchange, timeframe, className }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        symbol,
        exchange,
        timeframe,
      });
      const res = await fetch(`/api/exchanges/candles?${params}`);
      if (!res.ok) return;
      const json = await res.json();
      const candles = json.data ?? json;

      if (!seriesRef.current || !Array.isArray(candles)) return;

      const formatted: CandlestickData<Time>[] = candles.map(
        (c: { timestamp: number; open: number; high: number; low: number; close: number }) => ({
          time: (Math.floor(c.timestamp / 1000)) as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })
      );

      seriesRef.current.setData(formatted);
    } catch {
      // silently handle fetch errors
    }
  }, [symbol, exchange, timeframe]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#16161e' },
        textColor: '#8888a0',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#2a2a3a' },
        horzLines: { color: '#2a2a3a' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#2a2a3a',
      },
      timeScale: {
        borderColor: '#2a2a3a',
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    fetchData();

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [fetchData]);

  return (
    <div ref={containerRef} className={className ?? 'w-full h-full'} />
  );
}
