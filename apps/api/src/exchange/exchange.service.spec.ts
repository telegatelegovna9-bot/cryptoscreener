import { ExchangeService } from './exchange.service';

describe('ExchangeService ticker market filtering', () => {
  const redis = {
    getJSON: jest.fn(),
    setJSON: jest.fn(),
  };

  function serviceWithClients(spotClient: any, futuresClient: any) {
    const service = new ExchangeService(redis as any) as any;
    service.enforceRateLimit = jest.fn();
    service.getExchange = jest.fn(() => spotClient);
    service.getFuturesExchange = jest.fn(() => futuresClient);
    return service as ExchangeService;
  }

  it('returns only active USDT spot markets and excludes leveraged or non-spot symbols', async () => {
    const spotClient = {
      has: { fetchTickers: true },
      loadMarkets: jest.fn().mockResolvedValue({
        'BTC/USDT': { symbol: 'BTC/USDT', active: true, spot: true, quote: 'USDT' },
        'ETH/USDC': { symbol: 'ETH/USDC', active: true, spot: true, quote: 'USDC' },
        'SOL/USDT:USDT': { symbol: 'SOL/USDT:USDT', active: true, spot: false, swap: true, quote: 'USDT' },
        'BTC3L/USDT': { symbol: 'BTC3L/USDT', active: true, spot: true, quote: 'USDT' },
      }),
      fetchTickers: jest.fn().mockResolvedValue({
        'BTC/USDT': { last: 100, bid: 99, ask: 101, quoteVolume: 1000 },
        'ETH/USDC': { last: 10, bid: 9, ask: 11, quoteVolume: 1000 },
        'SOL/USDT:USDT': { last: 20, bid: 19, ask: 21, quoteVolume: 1000 },
        'BTC3L/USDT': { last: 1, bid: 0.9, ask: 1.1, quoteVolume: 1000 },
      }),
    };

    const service = serviceWithClients(spotClient, {});

    const tickers = await service.getTickers('binance', undefined, 'spot');

    expect(tickers.map((t) => t.symbol)).toEqual(['BTCUSDT']);
    expect(spotClient.fetchTickers).toHaveBeenCalledWith(['BTC/USDT']);
  });

  it('returns only active USDT linear perpetual futures markets', async () => {
    const futuresClient = {
      has: { fetchTickers: true },
      loadMarkets: jest.fn().mockResolvedValue({
        'BTC/USDT:USDT': {
          symbol: 'BTC/USDT:USDT',
          active: true,
          swap: true,
          linear: true,
          quote: 'USDT',
          settle: 'USDT',
        },
        'ETH/USDC:USDC': {
          symbol: 'ETH/USDC:USDC',
          active: true,
          swap: true,
          linear: true,
          quote: 'USDC',
          settle: 'USDC',
        },
        'BTC/USD:BTC': {
          symbol: 'BTC/USD:BTC',
          active: true,
          swap: true,
          inverse: true,
          quote: 'USD',
          settle: 'BTC',
        },
        'XRP/USDT-260628': {
          symbol: 'XRP/USDT-260628',
          active: true,
          future: true,
          linear: true,
          quote: 'USDT',
          settle: 'USDT',
          expiry: 1782604800000,
        },
      }),
      fetchTickers: jest.fn().mockResolvedValue({
        'BTC/USDT:USDT': { last: 100, bid: 99, ask: 101, quoteVolume: 1000 },
        'ETH/USDC:USDC': { last: 10, bid: 9, ask: 11, quoteVolume: 1000 },
        'BTC/USD:BTC': { last: 100, bid: 99, ask: 101, quoteVolume: 1000 },
        'XRP/USDT-260628': { last: 1, bid: 0.9, ask: 1.1, quoteVolume: 1000 },
      }),
    };

    const service = serviceWithClients({}, futuresClient);

    const tickers = await service.getTickers('binance', undefined, 'futures');

    expect(tickers.map((t) => t.symbol)).toEqual(['BTCUSDT:USDT']);
    expect(futuresClient.fetchTickers).toHaveBeenCalledWith(['BTC/USDT:USDT']);
  });
});
