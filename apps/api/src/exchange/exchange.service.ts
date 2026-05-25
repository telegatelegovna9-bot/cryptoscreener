import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as ccxt from 'ccxt';
import {
  Exchange,
  Ticker,
  Candle,
  OrderBook,
  OrderBookLevel,
  FundingRate,
  OpenInterest,
  Trade,
} from '@crypto-screener/shared';
import { RedisService } from '../redis/redis.service';

interface RateLimitState {
  lastRequest: number;
  requestCount: number;
  windowStart: number;
}

@Injectable()
export class ExchangeService implements OnModuleDestroy {
  private readonly logger = new Logger(ExchangeService.name);
  private readonly exchangeClients = new Map<string, ccxt.Exchange>();
  private readonly wsClients = new Map<string, any>();
  private readonly rateLimits = new Map<string, RateLimitState>();
  private readonly subscriptions = new Map<string, Set<(data: any) => void>>();
  private readonly activeStreams = new Map<string, boolean>();

  constructor(private readonly redis: RedisService) {}

  private readonly exchangeConfig: Record<string, { rateLimit: number; maxRequests: number }> = {
    [Exchange.BINANCE]: { rateLimit: 50, maxRequests: 1200 },
    [Exchange.BYBIT]: { rateLimit: 50, maxRequests: 600 },
    [Exchange.OKX]: { rateLimit: 100, maxRequests: 600 },
    [Exchange.KUCOIN]: { rateLimit: 100, maxRequests: 600 },
    [Exchange.BITGET]: { rateLimit: 100, maxRequests: 600 },
    [Exchange.GATE]: { rateLimit: 100, maxRequests: 600 },
    [Exchange.MEXC]: { rateLimit: 100, maxRequests: 600 },
    [Exchange.HYPERLIQUID]: { rateLimit: 100, maxRequests: 600 },
    [Exchange.COINBASE]: { rateLimit: 100, maxRequests: 600 },
  };

  async onModuleDestroy(): Promise<void> {
    for (const [id, client] of this.exchangeClients) {
      try {
        if (client.close) await client.close();
      } catch (err) {
        this.logger.warn(`Error closing exchange ${id}: ${err}`);
      }
    }
  }

  private getExchange(exchangeId: string): ccxt.Exchange {
    if (this.exchangeClients.has(exchangeId)) {
      return this.exchangeClients.get(exchangeId)!;
    }

    const ExchangeClass = (ccxt as any)[exchangeId];
    if (!ExchangeClass) {
      throw new Error(`Exchange ${exchangeId} not supported`);
    }

    const apiKey = process.env[`${exchangeId.toUpperCase()}_API_KEY`];
    const secret = process.env[`${exchangeId.toUpperCase()}_API_SECRET`];
    const password = process.env[`${exchangeId.toUpperCase()}_PASSPHRASE`];

    const config: any = {
      enableRateLimit: true,
      timeout: 30000,
    };

    if (apiKey) config.apiKey = apiKey;
    if (secret) config.secret = secret;
    if (password) config.password = password;

    const client = new ExchangeClass(config);
    this.exchangeClients.set(exchangeId, client);
    return client;
  }

  private getFuturesExchange(exchangeId: string): ccxt.Exchange {
    const cacheKey = `${exchangeId}:futures`;
    if (this.exchangeClients.has(cacheKey)) {
      return this.exchangeClients.get(cacheKey)!;
    }

    // Each exchange uses different CCXT ids and types for perpetual futures
    let futuresId = exchangeId;
    let defaultType = 'future';
    switch (exchangeId) {
      case 'binance':
        futuresId = 'binanceusdm'; // USDT-margined futures
        defaultType = 'future';
        break;
      case 'bybit':
        defaultType = 'linear'; // Linear perpetual contracts
        break;
      case 'okx':
        defaultType = 'swap'; // OKX perpetual swaps
        break;
      case 'kucoin':
        futuresId = 'kucoinfutures';
        defaultType = 'swap';
        break;
      case 'coinbase':
        futuresId = 'coinbaseadvanced';
        defaultType = 'swap';
        break;
    }

    const ExchangeClass = (ccxt as any)[futuresId];
    if (!ExchangeClass) {
      throw new Error(`Futures exchange ${futuresId} not supported`);
    }

    const apiKey = process.env[`${exchangeId.toUpperCase()}_API_KEY`];
    const secret = process.env[`${exchangeId.toUpperCase()}_API_SECRET`];
    const password = process.env[`${exchangeId.toUpperCase()}_PASSPHRASE`];

    const config: any = {
      enableRateLimit: true,
      timeout: 30000,
      options: { defaultType },
    };

    if (apiKey) config.apiKey = apiKey;
    if (secret) config.secret = secret;
    if (password) config.password = password;

    const client = new ExchangeClass(config);
    this.exchangeClients.set(cacheKey, client);
    return client;
  }

  private async enforceRateLimit(exchangeId: string): Promise<void> {
    const config = this.exchangeConfig[exchangeId];
    if (!config) return;

    const now = Date.now();
    let state = this.rateLimits.get(exchangeId);

    if (!state) {
      state = { lastRequest: 0, requestCount: 0, windowStart: now };
      this.rateLimits.set(exchangeId, state);
    }

    if (now - state.windowStart > 60000) {
      state.windowStart = now;
      state.requestCount = 0;
    }

    const elapsed = now - state.lastRequest;
    if (elapsed < config.rateLimit) {
      await new Promise((r) => setTimeout(r, config.rateLimit - elapsed));
    }

    state.lastRequest = Date.now();
    state.requestCount++;
  }

  normalizeSymbol(symbol: string, exchange: string): string {
    // "BTC/USDT:USDT" -> "BTCUSDT:USDT", "BTC/USDT" -> "BTCUSDT"
    const parts = symbol.split(':');
    const base = parts[0].replace('/', '').toUpperCase();
    return parts.length > 1 ? `${base}:${parts[1].toUpperCase()}` : base;
  }

  denormalizeSymbol(symbol: string, exchange: string): string {
    // Handle perpetual symbols like "BTCUSDT:USDT" -> "BTC/USDT:USDT"
    if (symbol.includes(':')) {
      const [base, settle] = symbol.split(':');
      const quoteCurrencies = ['USDT', 'USD', 'BUSD', 'USDC', 'BTC', 'ETH', 'EUR'];
      for (const quote of quoteCurrencies) {
        if (base.endsWith(quote) && base.length > quote.length) {
          return `${base.slice(0, -quote.length)}/${quote}:${settle}`;
        }
      }
      return symbol;
    }

    const quoteCurrencies = ['USDT', 'USD', 'BUSD', 'USDC', 'BTC', 'ETH', 'EUR'];
    for (const quote of quoteCurrencies) {
      if (symbol.endsWith(quote) && symbol.length > quote.length) {
        return `${symbol.slice(0, -quote.length)}/${quote}`;
      }
    }
    return symbol;
  }

  /** Filter out leveraged tokens (BTC3L, ETHUP, etc.) — keep everything else */
  private isLeveragedToken(symbol: string): boolean {
    // CCXT format: "BTC3L/USDT" — extract base
    const base = symbol.split('/')[0]?.split(':')[0];
    if (!base) return false;
    // Leveraged suffixes
    return /(3L|3S|5L|5S|UP|DOWN|BEAR|BULL|HEDGE|LONG|SHORT)$/i.test(base);
  }

  private isAllowedQuoteMarket(exchangeId: string, marketType: 'spot' | 'futures', market: any): boolean {
    const quote = String(market?.quote || '').toUpperCase();
    const settle = String(market?.settle || '').toUpperCase();

    // Hyperliquid and Coinbase perpetuals are USDC-settled in CCXT; there are no USDT perps there.
    if ((exchangeId === 'hyperliquid' || exchangeId === 'coinbase') && marketType === 'futures') {
      return quote === 'USDC' || settle === 'USDC';
    }

    return quote === 'USDT' || settle === 'USDT';
  }

  private isActiveMarket(market: any): boolean {
    return market?.active !== false;
  }

  private isSupportedSpotMarket(market: any, exchangeId: string): boolean {
    const symbol = String(market?.symbol || '');
    return this.isActiveMarket(market)
      && this.isAllowedQuoteMarket(exchangeId, 'spot', market)
      && (market?.spot === true || market?.type === 'spot')
      && !symbol.includes(':')
      && !market?.contract
      && !this.isLeveragedToken(symbol);
  }

  private isSupportedPerpetualMarket(market: any, exchangeId: string): boolean {
    return this.isActiveMarket(market)
      && this.isAllowedQuoteMarket(exchangeId, 'futures', market)
      && (market?.swap === true || market?.type === 'swap')
      && market?.linear !== false
      && market?.inverse !== true
      && !market?.expiry;
  }

  private supportsMarketType(exchangeId: string, marketType: 'spot' | 'futures'): boolean {
    const spotExchanges = new Set([
      'binance',
      'bybit',
      'okx',
      'kucoin',
      'bitget',
      'gate',
      'mexc',
      'hyperliquid',
      'coinbase',
    ]);
    const futuresExchanges = new Set([
      'binance',
      'bybit',
      'okx',
      'kucoin',
      'bitget',
      'gate',
      'mexc',
      'hyperliquid',
      'coinbase',
    ]);
    return marketType === 'spot' ? spotExchanges.has(exchangeId) : futuresExchanges.has(exchangeId);
  }

  private getQuoteVolume(ticker: any): number {
    if (typeof ticker.quoteVolume === 'number' && ticker.quoteVolume > 0) return ticker.quoteVolume;
    if (typeof ticker.baseVolume === 'number' && typeof ticker.last === 'number') {
      return ticker.baseVolume * ticker.last;
    }
    return 0;
  }

  private async getFilteredMarketSymbols(
    client: ccxt.Exchange,
    symbols: string[] | undefined,
    exchangeId: string,
    marketType: 'spot' | 'futures',
  ): Promise<string[] | undefined> {
    if (!client.loadMarkets) {
      return symbols?.map((s) => this.denormalizeSymbol(s, exchangeId));
    }

    const markets = await client.loadMarkets();
    (client as any).markets = (client as any).markets || markets;
    const requested = symbols
      ? new Set(symbols.map((s) => this.normalizeSymbol(this.denormalizeSymbol(s, exchangeId), exchangeId)))
      : null;

    return Object.values(markets)
      .filter((market: any) => marketType === 'spot'
        ? this.isSupportedSpotMarket(market, exchangeId)
        : this.isSupportedPerpetualMarket(market, exchangeId))
      .filter((market: any) => !requested || requested.has(this.normalizeSymbol(market.symbol, exchangeId)))
      .map((market: any) => market.symbol);
  }

  private async getOkxSpotTickers(
    client: ccxt.Exchange,
    marketSymbols: string[] | undefined,
  ): Promise<Array<[string, any]>> {
    const raw = await (client as any).publicGetMarketTickers({ instType: 'SPOT' });
    const requested = marketSymbols ? new Set(marketSymbols) : null;
    const marketsById = new Map<string, any>();

    for (const market of Object.values((client as any).markets || {}) as any[]) {
      if (market?.id) marketsById.set(market.id, market);
    }

    return (raw?.data || [])
      .map((item: any) => {
        const market = marketsById.get(item.instId);
        if (!market || (requested && !requested.has(market.symbol))) return null;

        const last = Number(item.last);
        const open = Number(item.open24h);
        const bid = Number(item.bidPx);
        const ask = Number(item.askPx);
        const change = Number.isFinite(last) && Number.isFinite(open) ? last - open : 0;

        return [market.symbol, {
          last,
          bid: Number.isFinite(bid) ? bid : 0,
          ask: Number.isFinite(ask) ? ask : 0,
          change,
          percentage: open > 0 ? (change / open) * 100 : 0,
          baseVolume: Number(item.vol24h) || 0,
          quoteVolume: Number(item.volCcy24h) || 0,
          high: Number(item.high24h) || last,
          low: Number(item.low24h) || last,
          timestamp: Number(item.ts) || Date.now(),
          info: item,
        }];
      })
      .filter(Boolean) as Array<[string, any]>;
  }

  async getTickers(exchangeId?: string, symbols?: string[], marketType?: string): Promise<Ticker[]> {
    const exchanges = exchangeId
      ? [exchangeId]
      : [Exchange.BINANCE, Exchange.BYBIT, Exchange.OKX];

    const results: Ticker[] = [];

    for (const exId of exchanges) {
      // Fetch spot tickers
      if (!marketType || marketType === 'spot') {
        if (!this.supportsMarketType(exId, 'spot')) continue;
        try {
          await this.enforceRateLimit(exId);
          const client = this.getExchange(exId);

          if (client.has['fetchTickers']) {
            const marketSymbols = await this.getFilteredMarketSymbols(client, symbols, exId, 'spot');
            if (marketSymbols && marketSymbols.length === 0) continue;

            const tickerEntries = exId === 'okx'
              ? await this.getOkxSpotTickers(client, marketSymbols)
              : Object.entries(await client.fetchTickers(marketSymbols)) as [string, any][];

            for (const [symbol, ticker] of tickerEntries) {
              if (!ticker || typeof ticker.last !== 'number' || ticker.last <= 0) continue;

              const market = (client.markets as any)?.[symbol];
              if (market && !this.isSupportedSpotMarket(market, exId)) continue;

              const normalizedSymbol = this.normalizeSymbol(symbol, exId);
              const spread = (ticker.ask || 0) - (ticker.bid || 0);

              results.push({
                symbol: normalizedSymbol,
                normalizedSymbol,
                exchange: exId as Exchange,
                marketType: 'spot',
                price: ticker.last,
                priceChange24h: ticker.change || 0,
                priceChangePercent24h: ticker.percentage || 0,
                volume24h: this.getQuoteVolume(ticker),
                quoteVolume24h: this.getQuoteVolume(ticker),
                trades24h: ticker.info?.count || ticker.info?.tradeCount || 0,
                high24h: ticker.high || ticker.last,
                low24h: ticker.low || ticker.last,
                bid: ticker.bid || 0,
                ask: ticker.ask || 0,
                spread,
                lastUpdate: ticker.timestamp || Date.now(),
              });
            }
          }
        } catch (err) {
          this.logger.warn(`Failed to fetch spot tickers from ${exId}: ${err}`);
        }
      }

      // Fetch futures/perpetual tickers
      if (!marketType || marketType === 'futures' || marketType === 'perpetual') {
        if (!this.supportsMarketType(exId, 'futures')) continue;
        try {
          await this.enforceRateLimit(exId);
          const futuresClient = this.getFuturesExchange(exId);

          if (futuresClient.has['fetchTickers']) {
            const marketSymbols = await this.getFilteredMarketSymbols(futuresClient, symbols, exId, 'futures');
            if (marketSymbols && marketSymbols.length === 0) continue;

            const tickers = await futuresClient.fetchTickers(marketSymbols);

            for (const [symbol, ticker] of Object.entries(tickers) as [string, any][]) {
              if (!ticker || typeof ticker.last !== 'number' || ticker.last <= 0) continue;
              const market = (futuresClient.markets as any)?.[symbol];
              if (market && !this.isSupportedPerpetualMarket(market, exId)) continue;

              const normalizedSymbol = this.normalizeSymbol(symbol, exId);
              const spread = (ticker.ask || 0) - (ticker.bid || 0);

              results.push({
                symbol: normalizedSymbol,
                normalizedSymbol,
                exchange: exId as Exchange,
                marketType: 'perpetual',
                price: ticker.last,
                priceChange24h: ticker.change || 0,
                priceChangePercent24h: ticker.percentage || 0,
                volume24h: this.getQuoteVolume(ticker),
                quoteVolume24h: this.getQuoteVolume(ticker),
                trades24h: ticker.info?.count || ticker.info?.tradeCount || 0,
                high24h: ticker.high || ticker.last,
                low24h: ticker.low || ticker.last,
                bid: ticker.bid || 0,
                ask: ticker.ask || 0,
                spread,
                lastUpdate: ticker.timestamp || Date.now(),
              });
            }
          }
        } catch (err) {
          this.logger.warn(`Failed to fetch futures tickers from ${exId}: ${err}`);
        }
      }
    }

    return results;
  }

  async getCandles(
    exchangeId: string,
    symbol: string,
    timeframe: string = '1h',
    since?: number,
    limit: number = 500,
  ): Promise<Candle[]> {
    // Cache key: separate recent (no since) and historical (with since) entries
    const cacheKey = since
      ? `candles:${exchangeId}:${symbol}:${timeframe}:${limit}:${since}`
      : `candles:${exchangeId}:${symbol}:${timeframe}:${limit}`;

    const cached = await this.redis.getJSON<Candle[]>(cacheKey);
    if (cached && cached.length > 0) return cached;

    await this.enforceRateLimit(exchangeId);
    // Use futures client for perpetual symbols (contain ':')
    const isPerpetual = symbol.includes(':');
    const client = isPerpetual ? this.getFuturesExchange(exchangeId) : this.getExchange(exchangeId);
    const ccxtSymbol = this.denormalizeSymbol(symbol, exchangeId);

    if (!client.has['fetchOHLCV']) {
      throw new Error(`Exchange ${exchangeId} does not support OHLCV`);
    }

    const ohlcv = since && typeof since === 'number' && since > 0
      ? await client.fetchOHLCV(ccxtSymbol, timeframe, since, limit)
      : await client.fetchOHLCV(ccxtSymbol, timeframe, undefined, limit);

    const candles = ohlcv.map((candle: any) => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      trades: candle[6] || 0,
      buyVolume: 0,
      sellVolume: 0,
    }));

    if (candles.length > 0) {
      // Recent candles: short TTL (still fresh). Historical: longer TTL (won't change)
      const ttl = since ? 300 : 60;
      await this.redis.setJSON(cacheKey, candles, ttl);
    }

    return candles;
  }

  /** Live candle fetch — skips cache, for WebSocket polling */
  async getCandlesLive(
    exchangeId: string,
    symbol: string,
    timeframe: string = '1h',
    limit: number = 1,
  ): Promise<Candle[]> {
    await this.enforceRateLimit(exchangeId);
    const isPerpetual = symbol.includes(':');
    const client = isPerpetual ? this.getFuturesExchange(exchangeId) : this.getExchange(exchangeId);
    const ccxtSymbol = this.denormalizeSymbol(symbol, exchangeId);

    if (!client.has['fetchOHLCV']) return [];

    const ohlcv = await client.fetchOHLCV(ccxtSymbol, timeframe, undefined, limit);

    return ohlcv.map((candle: any) => ({
      timestamp: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
      trades: candle[6] || 0,
      buyVolume: 0,
      sellVolume: 0,
    }));
  }

  async getOrderBook(exchangeId: string, symbol: string, limit: number = 50): Promise<OrderBook> {
    await this.enforceRateLimit(exchangeId);
    const client = this.getExchange(exchangeId);
    const ccxtSymbol = this.denormalizeSymbol(symbol, exchangeId);

    const book = await client.fetchOrderBook(ccxtSymbol, limit);

    const mapLevels = (levels: [number, number][]): OrderBookLevel[] =>
      levels
        .filter(([price, qty]) => typeof price === 'number' && typeof qty === 'number')
        .map(([price, qty]) => ({
          price,
          quantity: qty,
          count: 0,
        }));

    return {
      symbol: this.normalizeSymbol(ccxtSymbol, exchangeId),
      exchange: exchangeId as Exchange,
      bids: mapLevels(book.bids as [number, number][]),
      asks: mapLevels(book.asks as [number, number][]),
      timestamp: book.timestamp || Date.now(),
    };
  }

  async getFundingRate(exchangeId: string, symbol: string): Promise<FundingRate> {
    await this.enforceRateLimit(exchangeId);
    const client = this.getExchange(exchangeId);
    const ccxtSymbol = this.denormalizeSymbol(symbol, exchangeId);

    if (!client.has['fetchFundingRate']) {
      throw new Error(`Exchange ${exchangeId} does not support funding rates`);
    }

    const funding = await client.fetchFundingRate(ccxtSymbol);

    return {
      symbol: this.normalizeSymbol(ccxtSymbol, exchangeId),
      exchange: exchangeId as Exchange,
      rate: funding.fundingRate || 0,
      nextFundingTime: funding.fundingTimestamp || Date.now() + 8 * 3600 * 1000,
      timestamp: funding.timestamp || Date.now(),
    };
  }

  async getOpenInterest(exchangeId: string, symbol: string): Promise<OpenInterest> {
    await this.enforceRateLimit(exchangeId);
    const client = this.getExchange(exchangeId);
    const ccxtSymbol = this.denormalizeSymbol(symbol, exchangeId);

    if (!client.has['fetchOpenInterest']) {
      throw new Error(`Exchange ${exchangeId} does not support open interest`);
    }

    const oi = await client.fetchOpenInterest(ccxtSymbol);

    return {
      symbol: this.normalizeSymbol(ccxtSymbol, exchangeId),
      exchange: exchangeId as Exchange,
      value: oi.openInterestAmount || 0,
      valueChange24h: 0,
      valueChangePercent24h: 0,
      timestamp: oi.timestamp || Date.now(),
    };
  }

  getAllExchanges(): { id: string; name: string; enabled: boolean }[] {
    return Object.values(Exchange).map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      enabled: true,
    }));
  }

  async subscribeTickers(callback: (ticker: Ticker) => void): Promise<void> {
    const key = 'tickers_global';
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(callback);

    if (!this.activeStreams.has(key)) {
      this.activeStreams.set(key, true);
      this.startTickerStream();
    }
  }

  private async startTickerStream(): Promise<void> {
    const pollInterval = 5000;
    const key = 'tickers_global';

    const poll = async () => {
      if (!this.activeStreams.has(key)) return;

      try {
        const tickers = await this.getTickers(Exchange.BINANCE);
        const handlers = this.subscriptions.get(key);
        if (handlers) {
          for (const handler of handlers) {
            for (const ticker of tickers.slice(0, 50)) {
              try {
                handler(ticker);
              } catch (err) {
                this.logger.warn('Ticker handler error:', err);
              }
            }
          }
        }
      } catch (err) {
        this.logger.warn('Ticker stream error:', err);
      }

      if (this.activeStreams.has(key)) {
        setTimeout(poll, pollInterval);
      }
    };

    poll();
  }

  async subscribeTrades(
    symbol: string,
    exchangeId: string,
    callback: (trade: Trade) => void,
  ): Promise<void> {
    const key = `trades:${exchangeId}:${symbol}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(callback);

    if (!this.activeStreams.has(key)) {
      this.activeStreams.set(key, true);
      this.startTradeStream(symbol, exchangeId);
    }
  }

  private async startTradeStream(symbol: string, exchangeId: string): Promise<void> {
    const key = `trades:${exchangeId}:${symbol}`;
    const ccxtSymbol = this.denormalizeSymbol(symbol, exchangeId);
    const pollInterval = 2000;
    let lastTimestamp = 0;

    const poll = async () => {
      if (!this.activeStreams.has(key)) return;

      try {
        await this.enforceRateLimit(exchangeId);
        const client = this.getExchange(exchangeId);

        if (client.has['fetchTrades']) {
          const trades = await client.fetchTrades(ccxtSymbol, undefined, 50);
          const handlers = this.subscriptions.get(key);

          if (handlers) {
            for (const t of trades) {
              if ((t.timestamp || 0) > lastTimestamp) {
                lastTimestamp = t.timestamp || Date.now();
                const trade: Trade = {
                  id: t.id || `${exchangeId}-${t.timestamp}`,
                  symbol: this.normalizeSymbol(ccxtSymbol, exchangeId),
                  exchange: exchangeId as Exchange,
                  price: t.price || 0,
                  quantity: t.amount || 0,
                  side: t.side as 'buy' | 'sell',
                  timestamp: t.timestamp || Date.now(),
                  isLiquidation: false,
                };

                for (const handler of handlers) {
                  try {
                    handler(trade);
                  } catch (err) {
                    this.logger.warn('Trade handler error:', err);
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Trade stream error for ${key}: ${err}`);
      }

      if (this.activeStreams.has(key)) {
        setTimeout(poll, pollInterval);
      }
    };

    poll();
  }

  async subscribeOrderBook(
    symbol: string,
    exchangeId: string,
    callback: (book: OrderBook) => void,
  ): Promise<void> {
    const key = `orderbook:${exchangeId}:${symbol}`;
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)!.add(callback);

    if (!this.activeStreams.has(key)) {
      this.activeStreams.set(key, true);
      this.startOrderBookStream(symbol, exchangeId);
    }
  }

  private async startOrderBookStream(symbol: string, exchangeId: string): Promise<void> {
    const key = `orderbook:${exchangeId}:${symbol}`;
    const pollInterval = 1000;

    const poll = async () => {
      if (!this.activeStreams.has(key)) return;

      try {
        const book = await this.getOrderBook(exchangeId, symbol, 50);
        const handlers = this.subscriptions.get(key);
        if (handlers) {
          for (const handler of handlers) {
            try {
              handler(book);
            } catch (err) {
              this.logger.warn('Order book handler error:', err);
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Order book stream error for ${key}: ${err}`);
      }

      if (this.activeStreams.has(key)) {
        setTimeout(poll, pollInterval);
      }
    };

    poll();
  }

  unsubscribe(key: string): void {
    this.activeStreams.delete(key);
    this.subscriptions.delete(key);
  }
}
