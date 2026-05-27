// ============================================
// useTickers Hook
// React Query hook for fetching ticker data
// ============================================

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Exchange, Ticker } from '@crypto-screener/shared';
import { api } from '@/lib/api';
import { useTickerStore } from '@/stores/ticker';

interface TickersQueryParams {
  exchange: Exchange;
  marketType: 'spot' | 'futures';
}

async function fetchTickers(params: TickersQueryParams): Promise<Ticker[]> {
  const query = new URLSearchParams({
    exchange: params.exchange,
    marketType: params.marketType,
  });
  return api.get<Ticker[]>(`/api/exchanges/tickers?${query.toString()}`);
}

export function useTickers(params: TickersQueryParams) {
  const setTickers = useTickerStore((s) => s.setTickers);
  const setLoading = useTickerStore((s) => s.setLoading);

  const query = useQuery<Ticker[], Error>({
    queryKey: ['tickers', params.exchange, params.marketType],
    queryFn: () => fetchTickers(params),
    refetchInterval: 10_000,
    staleTime: 5_000,
    retry: 3,
  });

  useEffect(() => {
    if (query.data) {
      setTickers(query.data);
    }
  }, [query.data, setTickers]);

  useEffect(() => {
    setLoading(query.isLoading);
  }, [query.isLoading, setLoading]);

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
