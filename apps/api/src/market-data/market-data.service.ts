import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ExchangeService } from '../exchange/exchange.service';
import { RedisService } from '../redis/redis.service';
import { Exchange, Ticker, DEFAULT_SYMBOLS } from '@crypto-screener/shared';

const TICKER_CACHE_TTL = 5;
const TICKER_POLL_INTERVAL = 5000;

@Injectable()
export class MarketDataService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MarketDataService.name);
  private tickerCache: Ticker[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly callbacks = new Set<(ticker: Ticker) => void>();

  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.startTickerPolling();
  }

  onModuleDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private startTickerPolling(): void {
    const poll = async () => {
      try {
        // Fetch spot + futures tickers in parallel
        const [spotTickers, futuresTickers] = await Promise.all([
          this.exchangeService.getTickers(Exchange.BINANCE, undefined, 'spot'),
          this.exchangeService.getTickers(Exchange.BINANCE, undefined, 'futures'),
        ]);

        const tickers = [...spotTickers, ...futuresTickers];
        this.tickerCache = tickers;
        await this.redis.setJSON('tickers:binance', tickers, TICKER_CACHE_TTL);

        for (const ticker of tickers) {
          for (const cb of this.callbacks) {
            try {
              cb(ticker);
            } catch {
              // ignore handler errors
            }
          }
        }
      } catch (err) {
        this.logger.warn('Ticker polling error:', err);
      }
    };

    poll();
    this.pollTimer = setInterval(poll, TICKER_POLL_INTERVAL);
  }

  async getAggregatedTickers(
    exchanges?: Exchange[],
    symbols?: string[],
  ): Promise<Ticker[]> {
    const cached = await this.redis.getJSON<Ticker[]>('tickers:aggregated');
    if (cached && cached.length > 0) {
      return this.filterTickers(cached, exchanges, symbols);
    }

    const targetExchanges = exchanges || [Exchange.BINANCE, Exchange.BYBIT, Exchange.OKX];
    const allTickers: Ticker[] = [];

    for (const ex of targetExchanges) {
      try {
        const tickers = await this.exchangeService.getTickers(ex, symbols);
        allTickers.push(...tickers);
      } catch (err) {
        this.logger.warn(`Failed to fetch tickers from ${ex}:`, err);
      }
    }

    if (allTickers.length > 0) {
      await this.redis.setJSON('tickers:aggregated', allTickers, TICKER_CACHE_TTL);
    }

    return this.filterTickers(allTickers, exchanges, symbols);
  }

  private filterTickers(
    tickers: Ticker[],
    exchanges?: Exchange[],
    symbols?: string[],
  ): Ticker[] {
    let filtered = tickers;

    if (exchanges && exchanges.length > 0) {
      filtered = filtered.filter((t) => exchanges.includes(t.exchange));
    }

    if (symbols && symbols.length > 0) {
      const symbolSet = new Set(symbols.map((s) => s.toUpperCase()));
      filtered = filtered.filter((t) => symbolSet.has(t.symbol.toUpperCase()));
    }

    return filtered;
  }

  async getTopGainers(limit: number = 20): Promise<Ticker[]> {
    const tickers = await this.getAggregatedTickers([Exchange.BINANCE]);
    return [...tickers]
      .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
      .slice(0, limit);
  }

  async getTopLosers(limit: number = 20): Promise<Ticker[]> {
    const tickers = await this.getAggregatedTickers([Exchange.BINANCE]);
    return [...tickers]
      .sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h)
      .slice(0, limit);
  }

  async getTopVolume(limit: number = 20): Promise<Ticker[]> {
    const tickers = await this.getAggregatedTickers([Exchange.BINANCE]);
    return [...tickers]
      .sort((a, b) => b.quoteVolume24h - a.quoteVolume24h)
      .slice(0, limit);
  }

  async getTopVolatility(limit: number = 20): Promise<Ticker[]> {
    const tickers = await this.getAggregatedTickers([Exchange.BINANCE]);
    return [...tickers]
      .sort((a, b) => {
        const volA = a.high24h > 0 ? ((a.high24h - a.low24h) / a.high24h) * 100 : 0;
        const volB = b.high24h > 0 ? ((b.high24h - b.low24h) / b.high24h) * 100 : 0;
        return volB - volA;
      })
      .slice(0, limit);
  }

  subscribeToTickerUpdates(callback: (ticker: Ticker) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  async getTickerCache(): Promise<Ticker[]> {
    return this.tickerCache;
  }
}
