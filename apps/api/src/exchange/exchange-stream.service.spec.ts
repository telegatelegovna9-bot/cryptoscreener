import { ExchangeStreamService } from './exchange-stream.service';

describe('ExchangeStreamService stream mapping', () => {
  it('uses the routed Binance futures market WebSocket endpoint for candle streams', () => {
    const service = new ExchangeStreamService() as any;

    expect(service.getWsUrl('binance', true)).toBe('wss://fstream.binance.com/market/stream');
  });

  it('builds OKX perpetual candle subscriptions with SWAP instrument ids', () => {
    const service = new ExchangeStreamService() as any;

    expect(service.buildSubscribeMsg('okx', 'BTCUSDT:USDT', '1h')).toEqual({
      op: 'subscribe',
      args: [{ channel: 'candle1H', instId: 'BTC-USDT-SWAP' }],
    });
  });
});
