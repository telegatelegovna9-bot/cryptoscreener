// ============================================
// useWebSocket Hook
// Socket.IO connection with ticker + alert subs
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { Ticker, WSTickerUpdate, WSAlert } from '@crypto-screener/shared';
import { wsClient } from '@/lib/ws';
import { useTickerStore } from '@/stores/ticker';
import { useAlertStore } from '@/stores/alert';

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const updateTicker = useTickerStore((s) => s.updateTicker);
  const addAlert = useAlertStore((s) => s.addAlert);

  const handleTicker = useCallback(
    (...args: unknown[]) => {
      const data = args[0] as WSTickerUpdate;
      if (data?.ticker) {
        updateTicker(data.ticker as Ticker);
      }
    },
    [updateTicker],
  );

  const handleAlert = useCallback(
    (...args: unknown[]) => {
      const data = args[0] as WSAlert;
      if (data?.alert) {
        addAlert({
          ...data.alert,
          read: false,
        });
      }
    },
    [addAlert],
  );

  useEffect(() => {
    wsClient.connect();

    const checkConnection = () => {
      setConnected(wsClient.connected);
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    wsClient.subscribe('ticker', handleTicker);
    wsClient.subscribe('alert', handleAlert);

    return () => {
      clearInterval(interval);
      wsClient.unsubscribe('ticker', handleTicker);
      wsClient.unsubscribe('alert', handleAlert);
    };
  }, [handleTicker, handleAlert]);

  return { connected };
}
