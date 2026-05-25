import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeService } from '../exchange/exchange.service';
import { Exchange, Timeframe, Candle, DEFAULT_SYMBOLS } from '@crypto-screener/shared';

@Injectable()
export class CandleService {
  private readonly logger = new Logger(CandleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeService: ExchangeService,
  ) {}

  async getCandles(
    symbol: string,
    exchange: string,
    timeframe: string,
    startTime?: number,
    endTime?: number,
    limit: number = 500,
  ): Promise<Candle[]> {
    const where: any = {
      symbol: symbol.toUpperCase(),
      exchange,
      timeframe,
    };

    if (startTime || endTime) {
      where.timestamp = {};
      if (startTime) where.timestamp.gte = BigInt(startTime);
      if (endTime) where.timestamp.lte = BigInt(endTime);
    }

    const stored = await this.prisma.storedCandle.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: limit,
    });

    if (stored.length >= Math.min(limit, 100)) {
      return stored.map((c: any) => this.dbCandleToCandle(c));
    }

    try {
      const exchangeCandles = await this.exchangeService.getCandles(
        exchange,
        symbol,
        timeframe,
        startTime,
        limit,
      );

      if (exchangeCandles.length > 0) {
        await this.storeCandles(symbol, exchange, timeframe, exchangeCandles);
      }

      return exchangeCandles;
    } catch (err) {
      this.logger.warn(`Failed to fetch candles from exchange ${exchange}/${symbol}: ${err}`);
      return stored.map((c: any) => this.dbCandleToCandle(c));
    }
  }

  async storeCandles(
    symbol: string,
    exchange: string,
    timeframe: string,
    candles: Candle[],
  ): Promise<void> {
    if (candles.length === 0) return;

    const BATCH_SIZE = 500;
    for (let i = 0; i < candles.length; i += BATCH_SIZE) {
      const batch = candles.slice(i, i + BATCH_SIZE);

      const queries = batch.map((c) =>
        this.prisma.storedCandle.upsert({
          where: {
            symbol_exchange_timeframe_timestamp: {
              symbol: symbol.toUpperCase(),
              exchange,
              timeframe,
              timestamp: BigInt(c.timestamp),
            },
          },
          update: {
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
            trades: c.trades,
            buyVolume: c.buyVolume,
            sellVolume: c.sellVolume,
          },
          create: {
            symbol: symbol.toUpperCase(),
            exchange,
            timeframe,
            timestamp: BigInt(c.timestamp),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
            trades: c.trades,
            buyVolume: c.buyVolume,
            sellVolume: c.sellVolume,
          },
        }),
      );

      await this.prisma.$transaction(queries);
    }

    this.logger.log(`Stored ${candles.length} candles for ${symbol}/${exchange}/${timeframe}`);
  }

  async getHistoricalData(
    symbol: string,
    exchange: string,
    timeframe: string,
    days: number,
  ): Promise<Candle[]> {
    const tfMs = this.timeframeToMs(timeframe);
    const totalCandles = Math.ceil((days * 24 * 60 * 60 * 1000) / tfMs);
    const batchSize = 1000;
    const allCandles: Candle[] = [];
    let since = Date.now() - days * 24 * 60 * 60 * 1000;

    for (let fetched = 0; fetched < totalCandles; fetched += batchSize) {
      try {
        const candles = await this.exchangeService.getCandles(
          exchange,
          symbol,
          timeframe,
          since,
          Math.min(batchSize, totalCandles - fetched),
        );

        if (candles.length === 0) break;

        allCandles.push(...candles);
        since = candles[candles.length - 1].timestamp + tfMs;

        await this.storeCandles(symbol, exchange, timeframe, candles);

        if (candles.length < batchSize) break;
      } catch (err) {
        this.logger.warn(`Historical fetch error for ${symbol}: ${err}`);
        break;
      }
    }

    return allCandles;
  }

  async ingestTopSymbols(): Promise<void> {
    const symbols = DEFAULT_SYMBOLS.slice(0, 20);
    const timeframes = [Timeframe.H1, Timeframe.H4, Timeframe.D1];
    const exchange = Exchange.BINANCE;

    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          const candles = await this.exchangeService.getCandles(
            exchange,
            symbol,
            timeframe,
            undefined,
            100,
          );
          await this.storeCandles(symbol, exchange, timeframe, candles);
        } catch (err) {
          this.logger.warn(`Ingestion error for ${symbol}/${timeframe}: ${err}`);
        }
      }
    }

    this.logger.log('Candle ingestion job completed');
  }

  private dbCandleToCandle(c: any): Candle {
    return {
      timestamp: Number(c.timestamp),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      trades: c.trades,
      buyVolume: c.buyVolume,
      sellVolume: c.sellVolume,
    };
  }

  private timeframeToMs(tf: string): number {
    const map: Record<string, number> = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000,
    };
    return map[tf] || 3600000;
  }
}
