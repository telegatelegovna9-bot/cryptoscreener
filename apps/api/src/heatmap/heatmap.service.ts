import { Injectable, Logger } from '@nestjs/common';
import { ExchangeService } from '../exchange/exchange.service';
import { RedisService } from '../redis/redis.service';
import { Exchange, LiquidityHeatmapData, LiquidityLevel, OrderBookLevel } from '@crypto-screener/shared';

@Injectable()
export class HeatmapService {
  private readonly logger = new Logger(HeatmapService.name);

  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly redis: RedisService,
  ) {}

  async getHeatmapData(symbol: string, exchange: Exchange): Promise<LiquidityHeatmapData> {
    const cacheKey = `heatmap:${symbol}:${exchange}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const orderBook = await this.exchangeService.getOrderBook(exchange, symbol, 100);

    const levels = this.analyzeLiquidity(orderBook);

    const result: LiquidityHeatmapData = {
      symbol,
      exchange,
      levels,
      timestamp: Date.now(),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 2);

    return result;
  }

  private analyzeLiquidity(orderBook: {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  }): LiquidityLevel[] {
    const levels: LiquidityLevel[] = [];
    const allLevels = [
      ...orderBook.bids.map((l) => ({ ...l, side: 'bid' as const })),
      ...orderBook.asks.map((l) => ({ ...l, side: 'ask' as const })),
    ];

    // Calculate average quantity for anomaly detection
    const avgQty = allLevels.reduce((sum, l) => sum + l.quantity, 0) / allLevels.length;
    const maxQty = Math.max(...allLevels.map((l) => l.quantity));

    for (const level of allLevels) {
      let type: LiquidityLevel['type'] = 'limit';
      let confidence = 0.5;

      // Detect large liquidity walls (2x+ average)
      if (level.quantity > avgQty * 2) {
        type = 'limit';
        confidence = Math.min(0.9, 0.5 + (level.quantity / avgQty) * 0.1);
      }

      // Detect potential spoofing (very large orders that may be fake)
      if (level.quantity > avgQty * 5 && level.count <= 1) {
        type = 'spoof';
        confidence = 0.4;
      }

      // Detect iceberg orders (moderate size but many small fills)
      if (level.quantity > avgQty * 1.5 && level.count > 5) {
        type = 'iceberg';
        confidence = 0.6;
      }

      // Detect absorption (large orders being filled but price not moving)
      if (level.quantity > avgQty * 3 && level.count > 3) {
        type = 'absorption';
        confidence = 0.7;
      }

      levels.push({
        price: level.price,
        quantity: level.quantity,
        side: level.side,
        type,
        confidence,
        timestamp: Date.now(),
      });
    }

    // Detect stacked liquidity (multiple levels close together)
    this.detectStackedLiquidity(levels);

    return levels;
  }

  private detectStackedLiquidity(levels: LiquidityLevel[]): void {
    const sortedByPrice = [...levels].sort((a, b) => a.price - b.price);

    for (let i = 0; i < sortedByPrice.length - 2; i++) {
      const l1 = sortedByPrice[i];
      const l2 = sortedByPrice[i + 1];
      const l3 = sortedByPrice[i + 2];

      const priceGap1 = (l2.price - l1.price) / l1.price;
      const priceGap2 = (l3.price - l2.price) / l2.price;

      // If 3+ levels are within 0.1% of each other, mark as stacked
      if (priceGap1 < 0.001 && priceGap2 < 0.001) {
        l1.confidence = Math.min(0.95, l1.confidence + 0.2);
        l2.confidence = Math.min(0.95, l2.confidence + 0.2);
        l3.confidence = Math.min(0.95, l3.confidence + 0.2);
      }
    }
  }

  // Detect delta zones (difference between bid and ask volume)
  getDeltaZones(levels: LiquidityLevel[]): Array<{ price: number; delta: number }> {
    const priceMap = new Map<number, { bidVol: number; askVol: number }>();

    for (const level of levels) {
      const roundedPrice = Math.round(level.price * 100) / 100;
      const existing = priceMap.get(roundedPrice) ?? { bidVol: 0, askVol: 0 };

      if (level.side === 'bid') {
        existing.bidVol += level.quantity;
      } else {
        existing.askVol += level.quantity;
      }

      priceMap.set(roundedPrice, existing);
    }

    return Array.from(priceMap.entries())
      .map(([price, { bidVol, askVol }]) => ({
        price,
        delta: bidVol - askVol,
      }))
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }
}
