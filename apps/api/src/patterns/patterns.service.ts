import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeService } from '../exchange/exchange.service';
import { RedisService } from '../redis/redis.service';
import {
  DetectedPattern,
  PatternType,
  Timeframe,
  Exchange,
  Candle,
} from '@crypto-screener/shared';

@Injectable()
export class PatternsService {
  private readonly logger = new Logger(PatternsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeService: ExchangeService,
    private readonly redis: RedisService,
  ) {}

  async detectPatterns(
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): Promise<DetectedPattern[]> {
    const cacheKey = `patterns:${symbol}:${exchange}:${timeframe}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const candles = await this.exchangeService.getCandles(
      exchange,
      symbol,
      timeframe,
      undefined,
      500,
    );

    if (candles.length < 50) return [];

    const patterns: DetectedPattern[] = [];

    patterns.push(...this.detectSupportResistance(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectTriangles(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectWedges(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectFlags(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectChannels(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectDoubleTopBottom(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectHeadShoulders(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectBreakouts(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectBOS(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectCHOCH(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectFVG(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectOrderBlocks(candles, symbol, exchange, timeframe));
    patterns.push(...this.detectLiquiditySweeps(candles, symbol, exchange, timeframe));

    // Store in DB
    for (const pattern of patterns) {
      await this.prisma.detectedPattern.create({
        data: {
          symbol: pattern.symbol,
          exchange: pattern.exchange,
          type: pattern.type,
          timeframe: pattern.timeframe,
          confidence: pattern.confidence,
          description: pattern.description,
          points: pattern.points as any,
          direction: pattern.direction,
          targetPrice: pattern.targetPrice ?? null,
          stopLoss: pattern.stopLoss ?? null,
        },
      });
    }

    await this.redis.set(cacheKey, JSON.stringify(patterns), 300);

    return patterns;
  }

  async getLatestPatterns(filters?: {
    symbol?: string;
    exchange?: Exchange;
    type?: PatternType;
    timeframe?: Timeframe;
    limit?: number;
  }): Promise<DetectedPattern[]> {
    const where: any = {};
    if (filters?.symbol) where.symbol = filters.symbol;
    if (filters?.exchange) where.exchange = filters.exchange;
    if (filters?.type) where.type = filters.type;
    if (filters?.timeframe) where.timeframe = filters.timeframe;

    const rows = await this.prisma.detectedPattern.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 50,
    });

    return rows.map((r: any) => ({
      id: r.id,
      symbol: r.symbol,
      exchange: r.exchange as Exchange,
      type: r.type as PatternType,
      timeframe: r.timeframe as Timeframe,
      confidence: r.confidence,
      description: r.description,
      points: r.points as any[],
      direction: r.direction as 'bullish' | 'bearish' | 'neutral',
      targetPrice: r.targetPrice ?? undefined,
      stopLoss: r.stopLoss ?? undefined,
      timestamp: r.createdAt.getTime(),
    }));
  }

  // --- Support & Resistance Detection ---
  private detectSupportResistance(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const lookback = 50;
    const threshold = 0.005; // 0.5% tolerance

    for (let i = lookback; i < candles.length; i++) {
      const window = candles.slice(i - lookback, i);
      const lows = window.map((c) => c.low);
      const highs = window.map((c) => c.high);
      const currentPrice = candles[i].close;

      // Find support levels (multiple touches at similar low)
      const supportLevels = this.findLevels(lows, threshold);
      for (const level of supportLevels) {
        if (Math.abs(currentPrice - level) / level < threshold) {
          patterns.push({
            id: `sr-${symbol}-${i}-support`,
            symbol,
            exchange,
            type: PatternType.SUPPORT,
            timeframe,
            confidence: 0.7,
            description: `Support level at ${level.toFixed(2)} with multiple touches`,
            points: [
              { timestamp: window[0].timestamp, price: level },
              { timestamp: window[window.length - 1].timestamp, price: level },
            ],
            direction: 'bullish',
            targetPrice: level * 1.02,
            stopLoss: level * 0.98,
            timestamp: candles[i].timestamp,
          });
        }
      }

      // Find resistance levels
      const resistanceLevels = this.findLevels(highs, threshold);
      for (const level of resistanceLevels) {
        if (Math.abs(currentPrice - level) / level < threshold) {
          patterns.push({
            id: `sr-${symbol}-${i}-resistance`,
            symbol,
            exchange,
            type: PatternType.RESISTANCE,
            timeframe,
            confidence: 0.7,
            description: `Resistance level at ${level.toFixed(2)} with multiple touches`,
            points: [
              { timestamp: window[0].timestamp, price: level },
              { timestamp: window[window.length - 1].timestamp, price: level },
            ],
            direction: 'bearish',
            targetPrice: level * 0.98,
            stopLoss: level * 1.02,
            timestamp: candles[i].timestamp,
          });
        }
      }
    }

    return patterns.slice(-10); // Return last 10
  }

  private findLevels(prices: number[], threshold: number): number[] {
    const levels: number[] = [];
    const sorted = [...prices].sort((a, b) => a - b);

    let cluster: number[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      if ((sorted[i] - cluster[0]) / cluster[0] < threshold) {
        cluster.push(sorted[i]);
      } else {
        if (cluster.length >= 3) {
          levels.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
        }
        cluster = [sorted[i]];
      }
    }
    if (cluster.length >= 3) {
      levels.push(cluster.reduce((a, b) => a + b, 0) / cluster.length);
    }

    return levels;
  }

  // --- Triangle Detection ---
  private detectTriangles(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const windowSize = 30;

    for (let i = windowSize; i < candles.length; i++) {
      const window = candles.slice(i - windowSize, i);
      const highs = window.map((c) => c.high);
      const lows = window.map((c) => c.low);

      // Linear regression on highs and lows
      const highSlope = this.linearSlope(highs);
      const lowSlope = this.linearSlope(lows);

      // Ascending triangle: flat highs, rising lows
      if (Math.abs(highSlope) < 0.001 && lowSlope > 0.0005) {
        patterns.push({
          id: `tri-${symbol}-${i}-asc`,
          symbol,
          exchange,
          type: PatternType.TRIANGLE,
          timeframe,
          confidence: 0.65,
          description: 'Ascending triangle — rising support with flat resistance, bullish bias',
          points: [
            { timestamp: window[0].timestamp, price: Math.max(...highs) },
            { timestamp: window[window.length - 1].timestamp, price: Math.max(...highs) },
            { timestamp: window[0].timestamp, price: lows[0] },
            { timestamp: window[window.length - 1].timestamp, price: lows[lows.length - 1] },
          ],
          direction: 'bullish',
          targetPrice: Math.max(...highs) + (Math.max(...highs) - Math.min(...lows)),
          stopLoss: Math.min(...lows) * 0.99,
          timestamp: candles[i].timestamp,
        });
      }

      // Descending triangle: flat lows, falling highs
      if (Math.abs(lowSlope) < 0.001 && highSlope < -0.0005) {
        patterns.push({
          id: `tri-${symbol}-${i}-desc`,
          symbol,
          exchange,
          type: PatternType.TRIANGLE,
          timeframe,
          confidence: 0.65,
          description: 'Descending triangle — falling resistance with flat support, bearish bias',
          points: [
            { timestamp: window[0].timestamp, price: highs[0] },
            { timestamp: window[window.length - 1].timestamp, price: highs[highs.length - 1] },
            { timestamp: window[0].timestamp, price: Math.min(...lows) },
            { timestamp: window[window.length - 1].timestamp, price: Math.min(...lows) },
          ],
          direction: 'bearish',
          targetPrice: Math.min(...lows) - (Math.max(...highs) - Math.min(...lows)),
          stopLoss: Math.max(...highs) * 1.01,
          timestamp: candles[i].timestamp,
        });
      }

      // Symmetrical triangle: converging highs and lows
      if (highSlope < -0.0003 && lowSlope > 0.0003) {
        patterns.push({
          id: `tri-${symbol}-${i}-sym`,
          symbol,
          exchange,
          type: PatternType.TRIANGLE,
          timeframe,
          confidence: 0.6,
          description: 'Symmetrical triangle — converging trendlines, breakout expected',
          points: [
            { timestamp: window[0].timestamp, price: highs[0] },
            { timestamp: window[window.length - 1].timestamp, price: highs[highs.length - 1] },
            { timestamp: window[0].timestamp, price: lows[0] },
            { timestamp: window[window.length - 1].timestamp, price: lows[lows.length - 1] },
          ],
          direction: 'neutral',
          timestamp: candles[i].timestamp,
        });
      }
    }

    return patterns.slice(-5);
  }

  // --- Wedge Detection ---
  private detectWedges(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const windowSize = 25;

    for (let i = windowSize; i < candles.length; i++) {
      const window = candles.slice(i - windowSize, i);
      const highs = window.map((c) => c.high);
      const lows = window.map((c) => c.low);

      const highSlope = this.linearSlope(highs);
      const lowSlope = this.linearSlope(lows);

      // Rising wedge: both slopes positive, high slope > low slope
      if (highSlope > 0.0003 && lowSlope > 0.0003 && highSlope < lowSlope) {
        patterns.push({
          id: `wedge-${symbol}-${i}-rising`,
          symbol,
          exchange,
          type: PatternType.WEDGE,
          timeframe,
          confidence: 0.6,
          description: 'Rising wedge — bearish reversal pattern with converging upward trendlines',
          points: [
            { timestamp: window[0].timestamp, price: highs[0] },
            { timestamp: window[window.length - 1].timestamp, price: highs[highs.length - 1] },
            { timestamp: window[0].timestamp, price: lows[0] },
            { timestamp: window[window.length - 1].timestamp, price: lows[lows.length - 1] },
          ],
          direction: 'bearish',
          timestamp: candles[i].timestamp,
        });
      }

      // Falling wedge: both slopes negative
      if (highSlope < -0.0003 && lowSlope < -0.0003 && highSlope > lowSlope) {
        patterns.push({
          id: `wedge-${symbol}-${i}-falling`,
          symbol,
          exchange,
          type: PatternType.WEDGE,
          timeframe,
          confidence: 0.6,
          description: 'Falling wedge — bullish reversal pattern with converging downward trendlines',
          points: [
            { timestamp: window[0].timestamp, price: highs[0] },
            { timestamp: window[window.length - 1].timestamp, price: highs[highs.length - 1] },
            { timestamp: window[0].timestamp, price: lows[0] },
            { timestamp: window[window.length - 1].timestamp, price: lows[lows.length - 1] },
          ],
          direction: 'bullish',
          timestamp: candles[i].timestamp,
        });
      }
    }

    return patterns.slice(-5);
  }

  // --- Flag Detection ---
  private detectFlags(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const poleSize = 15;
    const flagSize = 10;

    for (let i = poleSize + flagSize; i < candles.length; i++) {
      const pole = candles.slice(i - poleSize - flagSize, i - flagSize);
      const flag = candles.slice(i - flagSize, i);

      const poleMove = (pole[pole.length - 1].close - pole[0].open) / pole[0].open;
      const flagSlope = this.linearSlope(flag.map((c) => c.close));

      // Bull flag: strong upward pole, slight downward flag
      if (poleMove > 0.05 && flagSlope < 0 && flagSlope > -0.003) {
        patterns.push({
          id: `flag-${symbol}-${i}-bull`,
          symbol,
          exchange,
          type: PatternType.FLAG,
          timeframe,
          confidence: 0.65,
          description: `Bull flag — ${(poleMove * 100).toFixed(1)}% pole followed by consolidation`,
          points: [
            { timestamp: pole[0].timestamp, price: pole[0].open },
            { timestamp: pole[pole.length - 1].timestamp, price: pole[pole.length - 1].close },
            { timestamp: flag[0].timestamp, price: flag[0].high },
            { timestamp: flag[flag.length - 1].timestamp, price: flag[flag.length - 1].low },
          ],
          direction: 'bullish',
          targetPrice: flag[flag.length - 1].close + poleMove * flag[flag.length - 1].close,
          timestamp: candles[i].timestamp,
        });
      }

      // Bear flag: strong downward pole, slight upward flag
      if (poleMove < -0.05 && flagSlope > 0 && flagSlope < 0.003) {
        patterns.push({
          id: `flag-${symbol}-${i}-bear`,
          symbol,
          exchange,
          type: PatternType.FLAG,
          timeframe,
          confidence: 0.65,
          description: `Bear flag — ${(Math.abs(poleMove) * 100).toFixed(1)}% pole followed by consolidation`,
          points: [
            { timestamp: pole[0].timestamp, price: pole[0].open },
            { timestamp: pole[pole.length - 1].timestamp, price: pole[pole.length - 1].close },
            { timestamp: flag[0].timestamp, price: flag[0].low },
            { timestamp: flag[flag.length - 1].timestamp, price: flag[flag.length - 1].high },
          ],
          direction: 'bearish',
          targetPrice: flag[flag.length - 1].close - Math.abs(poleMove) * flag[flag.length - 1].close,
          timestamp: candles[i].timestamp,
        });
      }
    }

    return patterns.slice(-5);
  }

  // --- Channel Detection ---
  private detectChannels(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const windowSize = 30;

    for (let i = windowSize; i < candles.length; i++) {
      const window = candles.slice(i - windowSize, i);
      const highs = window.map((c) => c.high);
      const lows = window.map((c) => c.low);

      const highSlope = this.linearSlope(highs);
      const lowSlope = this.linearSlope(lows);
      const slopeDiff = Math.abs(highSlope - lowSlope);
      const avgRange = (Math.max(...highs) - Math.min(...lows)) / window[0].close;

      // Parallel channel
      if (slopeDiff < 0.0005 && avgRange > 0.02) {
        const direction = highSlope > 0.0003 ? 'bullish' : highSlope < -0.0003 ? 'bearish' : 'neutral';
        patterns.push({
          id: `chan-${symbol}-${i}`,
          symbol,
          exchange,
          type: PatternType.CHANNEL,
          timeframe,
          confidence: 0.55,
          description: `${direction === 'bullish' ? 'Ascending' : direction === 'bearish' ? 'Descending' : 'Horizontal'} channel — ${(avgRange * 100).toFixed(1)}% range`,
          points: [
            { timestamp: window[0].timestamp, price: highs[0] },
            { timestamp: window[window.length - 1].timestamp, price: highs[highs.length - 1] },
            { timestamp: window[0].timestamp, price: lows[0] },
            { timestamp: window[window.length - 1].timestamp, price: lows[lows.length - 1] },
          ],
          direction,
          timestamp: candles[i].timestamp,
        });
      }
    }

    return patterns.slice(-5);
  }

  // --- Double Top/Bottom Detection ---
  private detectDoubleTopBottom(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const windowSize = 40;

    for (let i = windowSize; i < candles.length; i++) {
      const window = candles.slice(i - windowSize, i);
      const highs = window.map((c) => c.high);
      const lows = window.map((c) => c.low);
      const closes = window.map((c) => c.close);

      // Find two peaks
      const peaks = this.findPeaks(highs, 5);
      if (peaks.length >= 2) {
        const last2 = peaks.slice(-2);
        const peakDiff = Math.abs(highs[last2[0]] - highs[last2[1]]) / highs[last2[0]];
        const trough = Math.min(...lows.slice(last2[0], last2[1]));

        if (peakDiff < 0.02 && (highs[last2[0]] - trough) / highs[last2[0]] > 0.02) {
          patterns.push({
            id: `dt-${symbol}-${i}`,
            symbol,
            exchange,
            type: PatternType.DOUBLE_TOP,
            timeframe,
            confidence: 0.6,
            description: 'Double top — bearish reversal pattern at resistance',
            points: [
              { timestamp: window[last2[0]].timestamp, price: highs[last2[0]] },
              { timestamp: window[Math.floor((last2[0] + last2[1]) / 2)].timestamp, price: trough },
              { timestamp: window[last2[1]].timestamp, price: highs[last2[1]] },
            ],
            direction: 'bearish',
            targetPrice: trough - (highs[last2[0]] - trough),
            stopLoss: Math.max(highs[last2[0]], highs[last2[1]]) * 1.01,
            timestamp: candles[i].timestamp,
          });
        }
      }

      // Find two troughs
      const troughs = this.findPeaks(lows.map((v) => -v), 5).map((idx) => idx);
      if (troughs.length >= 2) {
        const last2 = troughs.slice(-2);
        const troughDiff = Math.abs(lows[last2[0]] - lows[last2[1]]) / lows[last2[0]];
        const peak = Math.max(...highs.slice(last2[0], last2[1]));

        if (troughDiff < 0.02 && (peak - lows[last2[0]]) / lows[last2[0]] > 0.02) {
          patterns.push({
            id: `db-${symbol}-${i}`,
            symbol,
            exchange,
            type: PatternType.DOUBLE_BOTTOM,
            timeframe,
            confidence: 0.6,
            description: 'Double bottom — bullish reversal pattern at support',
            points: [
              { timestamp: window[last2[0]].timestamp, price: lows[last2[0]] },
              { timestamp: window[Math.floor((last2[0] + last2[1]) / 2)].timestamp, price: peak },
              { timestamp: window[last2[1]].timestamp, price: lows[last2[1]] },
            ],
            direction: 'bullish',
            targetPrice: peak + (peak - lows[last2[0]]),
            stopLoss: Math.min(lows[last2[0]], lows[last2[1]]) * 0.99,
            timestamp: candles[i].timestamp,
          });
        }
      }
    }

    return patterns.slice(-5);
  }

  // --- Head & Shoulders Detection ---
  private detectHeadShoulders(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const windowSize = 50;

    for (let i = windowSize; i < candles.length; i++) {
      const window = candles.slice(i - windowSize, i);
      const highs = window.map((c) => c.high);

      const peaks = this.findPeaks(highs, 5);
      if (peaks.length >= 3) {
        const [p1, p2, p3] = peaks.slice(-3);
        const headHeight = highs[p2];
        const leftShoulder = highs[p1];
        const rightShoulder = highs[p3];

        // Head must be higher than both shoulders
        if (headHeight > leftShoulder && headHeight > rightShoulder) {
          // Shoulders should be roughly equal
          const shoulderDiff = Math.abs(leftShoulder - rightShoulder) / leftShoulder;
          if (shoulderDiff < 0.05) {
            const neckline = Math.min(
              ...window.slice(p1, p2).map((c) => c.low),
              ...window.slice(p2, p3).map((c) => c.low),
            );

            patterns.push({
              id: `hs-${symbol}-${i}`,
              symbol,
              exchange,
              type: PatternType.HEAD_SHOULDERS,
              timeframe,
              confidence: 0.65,
              description: 'Head & Shoulders — classic bearish reversal pattern',
              points: [
                { timestamp: window[p1].timestamp, price: leftShoulder },
                { timestamp: window[p2].timestamp, price: headHeight },
                { timestamp: window[p3].timestamp, price: rightShoulder },
                { timestamp: window[p1].timestamp, price: neckline },
                { timestamp: window[p3].timestamp, price: neckline },
              ],
              direction: 'bearish',
              targetPrice: neckline - (headHeight - neckline),
              stopLoss: headHeight * 1.01,
              timestamp: candles[i].timestamp,
            });
          }
        }
      }
    }

    return patterns.slice(-3);
  }

  // --- Breakout Detection ---
  private detectBreakouts(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const windowSize = 20;

    for (let i = windowSize + 1; i < candles.length; i++) {
      const window = candles.slice(i - windowSize, i);
      const prevCandle = candles[i - 1];
      const currentCandle = candles[i];

      const resistance = Math.max(...window.map((c) => c.high));
      const support = Math.min(...window.map((c) => c.low));
      const avgVolume = window.reduce((sum, c) => sum + c.volume, 0) / window.length;

      // Bullish breakout
      if (currentCandle.close > resistance && currentCandle.volume > avgVolume * 1.5) {
        patterns.push({
          id: `bo-${symbol}-${i}-bull`,
          symbol,
          exchange,
          type: PatternType.BREAKOUT,
          timeframe,
          confidence: 0.7,
          description: `Bullish breakout above ${resistance.toFixed(2)} with ${((currentCandle.volume / avgVolume - 1) * 100).toFixed(0)}% volume increase`,
          points: [
            { timestamp: window[0].timestamp, price: resistance },
            { timestamp: window[window.length - 1].timestamp, price: resistance },
            { timestamp: currentCandle.timestamp, price: currentCandle.close },
          ],
          direction: 'bullish',
          targetPrice: resistance + (resistance - support),
          stopLoss: resistance * 0.98,
          timestamp: currentCandle.timestamp,
        });
      }

      // Bearish breakout
      if (currentCandle.close < support && currentCandle.volume > avgVolume * 1.5) {
        patterns.push({
          id: `bo-${symbol}-${i}-bear`,
          symbol,
          exchange,
          type: PatternType.BREAKOUT,
          timeframe,
          confidence: 0.7,
          description: `Bearish breakdown below ${support.toFixed(2)} with ${((currentCandle.volume / avgVolume - 1) * 100).toFixed(0)}% volume increase`,
          points: [
            { timestamp: window[0].timestamp, price: support },
            { timestamp: window[window.length - 1].timestamp, price: support },
            { timestamp: currentCandle.timestamp, price: currentCandle.close },
          ],
          direction: 'bearish',
          targetPrice: support - (resistance - support),
          stopLoss: support * 1.02,
          timestamp: currentCandle.timestamp,
        });
      }
    }

    return patterns.slice(-5);
  }

  // --- BOS (Break of Structure) Detection ---
  private detectBOS(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const swingLookback = 10;

    for (let i = swingLookback * 2; i < candles.length; i++) {
      const window = candles.slice(i - swingLookback * 2, i);
      const highs = window.map((c) => c.high);
      const lows = window.map((c) => c.low);

      const swingHighs = this.findPeaks(highs, swingLookback);
      const swingLows = this.findPeaks(lows.map((v) => -v), swingLookback);

      if (swingHighs.length >= 2 && swingLows.length >= 2) {
        const prevHigh = highs[swingHighs[swingHighs.length - 2]];
        const currHigh = highs[swingHighs[swingHighs.length - 1]];
        const prevLow = lows[swingLows[swingLows.length - 2]];
        const currLow = lows[swingLows[swingLows.length - 1]];

        // Bullish BOS: higher high
        if (currHigh > prevHigh && currLow > prevLow) {
          patterns.push({
            id: `bos-${symbol}-${i}-bull`,
            symbol,
            exchange,
            type: PatternType.BOS,
            timeframe,
            confidence: 0.6,
            description: 'Bullish Break of Structure — higher high and higher low confirmed',
            points: [
              { timestamp: window[swingHighs[swingHighs.length - 2]].timestamp, price: prevHigh },
              { timestamp: window[swingHighs[swingHighs.length - 1]].timestamp, price: currHigh },
            ],
            direction: 'bullish',
            timestamp: candles[i - 1].timestamp,
          });
        }

        // Bearish BOS: lower low
        if (currLow < prevLow && currHigh < prevHigh) {
          patterns.push({
            id: `bos-${symbol}-${i}-bear`,
            symbol,
            exchange,
            type: PatternType.BOS,
            timeframe,
            confidence: 0.6,
            description: 'Bearish Break of Structure — lower low and lower high confirmed',
            points: [
              { timestamp: window[swingLows[swingLows.length - 2]].timestamp, price: prevLow },
              { timestamp: window[swingLows[swingLows.length - 1]].timestamp, price: currLow },
            ],
            direction: 'bearish',
            timestamp: candles[i - 1].timestamp,
          });
        }
      }
    }

    return patterns.slice(-5);
  }

  // --- CHOCH (Change of Character) Detection ---
  private detectCHOCH(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const swingLookback = 10;

    for (let i = swingLookback * 3; i < candles.length; i++) {
      const window = candles.slice(i - swingLookback * 3, i);
      const highs = window.map((c) => c.high);
      const lows = window.map((c) => c.low);

      const swingHighs = this.findPeaks(highs, swingLookback);
      const swingLows = this.findPeaks(lows.map((v) => -v), swingLookback);

      if (swingHighs.length >= 3 && swingLows.length >= 3) {
        // CHOCH: trend change — e.g., uptrend broken by lower low
        const h1 = highs[swingHighs[swingHighs.length - 3]];
        const h2 = highs[swingHighs[swingHighs.length - 2]];
        const l1 = lows[swingLows[swingLows.length - 3]];
        const l2 = lows[swingLows[swingLows.length - 2]];
        const currLow = lows[swingLows[swingLows.length - 1]];

        // Was uptrending (HH, HL), now making LL = bearish CHOCH
        if (h2 > h1 && l2 > l1 && currLow < l2) {
          patterns.push({
            id: `choch-${symbol}-${i}-bear`,
            symbol,
            exchange,
            type: PatternType.CHOCH,
            timeframe,
            confidence: 0.6,
            description: 'Bearish Change of Character — uptrend broken by lower low',
            points: [
              { timestamp: window[swingLows[swingLows.length - 2]].timestamp, price: l2 },
              { timestamp: window[swingLows[swingLows.length - 1]].timestamp, price: currLow },
            ],
            direction: 'bearish',
            timestamp: candles[i - 1].timestamp,
          });
        }
      }
    }

    return patterns.slice(-3);
  }

  // --- FVG (Fair Value Gap) Detection ---
  private detectFVG(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    for (let i = 2; i < candles.length; i++) {
      const c1 = candles[i - 2];
      const c2 = candles[i - 1];
      const c3 = candles[i];

      // Bullish FVG: gap between candle 1 high and candle 3 low
      if (c3.low > c1.high && c2.close > c2.open) {
        const gapSize = (c3.low - c1.high) / c1.close;
        if (gapSize > 0.002) {
          patterns.push({
            id: `fvg-${symbol}-${i}-bull`,
            symbol,
            exchange,
            type: PatternType.FVG,
            timeframe,
            confidence: 0.55,
            description: `Bullish Fair Value Gap — ${(gapSize * 100).toFixed(2)}% gap between ${c1.high.toFixed(2)} and ${c3.low.toFixed(2)}`,
            points: [
              { timestamp: c1.timestamp, price: c1.high },
              { timestamp: c3.timestamp, price: c3.low },
            ],
            direction: 'bullish',
            timestamp: c3.timestamp,
          });
        }
      }

      // Bearish FVG: gap between candle 3 high and candle 1 low
      if (c3.high < c1.low && c2.close < c2.open) {
        const gapSize = (c1.low - c3.high) / c1.close;
        if (gapSize > 0.002) {
          patterns.push({
            id: `fvg-${symbol}-${i}-bear`,
            symbol,
            exchange,
            type: PatternType.FVG,
            timeframe,
            confidence: 0.55,
            description: `Bearish Fair Value Gap — ${(gapSize * 100).toFixed(2)}% gap between ${c3.high.toFixed(2)} and ${c1.low.toFixed(2)}`,
            points: [
              { timestamp: c3.timestamp, price: c3.high },
              { timestamp: c1.timestamp, price: c1.low },
            ],
            direction: 'bearish',
            timestamp: c3.timestamp,
          });
        }
      }
    }

    return patterns.slice(-10);
  }

  // --- Order Block Detection ---
  private detectOrderBlocks(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    for (let i = 5; i < candles.length; i++) {
      const window = candles.slice(Math.max(0, i - 5), i);
      const current = candles[i];

      // Bullish order block: last bearish candle before strong bullish move
      const avgMove = window.reduce((sum, c) => sum + Math.abs(c.close - c.open), 0) / window.length;
      const currentMove = current.close - current.open;

      if (currentMove > avgMove * 2 && current.close > current.open) {
        // Find last bearish candle before this move
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          if (candles[j].close < candles[j].open) {
            patterns.push({
              id: `ob-${symbol}-${i}-bull`,
              symbol,
              exchange,
              type: PatternType.ORDER_BLOCK,
              timeframe,
              confidence: 0.55,
              description: `Bullish order block at ${candles[j].open.toFixed(2)}-${candles[j].close.toFixed(2)} — institutional buying zone`,
              points: [
                { timestamp: candles[j].timestamp, price: candles[j].open },
                { timestamp: candles[j].timestamp, price: candles[j].close },
                { timestamp: current.timestamp, price: current.close },
              ],
              direction: 'bullish',
              timestamp: current.timestamp,
            });
            break;
          }
        }
      }

      // Bearish order block
      if (currentMove < -avgMove * 2 && current.close < current.open) {
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          if (candles[j].close > candles[j].open) {
            patterns.push({
              id: `ob-${symbol}-${i}-bear`,
              symbol,
              exchange,
              type: PatternType.ORDER_BLOCK,
              timeframe,
              confidence: 0.55,
              description: `Bearish order block at ${candles[j].close.toFixed(2)}-${candles[j].open.toFixed(2)} — institutional selling zone`,
              points: [
                { timestamp: candles[j].timestamp, price: candles[j].close },
                { timestamp: candles[j].timestamp, price: candles[j].open },
                { timestamp: current.timestamp, price: current.close },
              ],
              direction: 'bearish',
              timestamp: current.timestamp,
            });
            break;
          }
        }
      }
    }

    return patterns.slice(-10);
  }

  // --- Liquidity Sweep Detection ---
  private detectLiquiditySweeps(
    candles: Candle[],
    symbol: string,
    exchange: Exchange,
    timeframe: Timeframe,
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    const lookback = 20;

    for (let i = lookback; i < candles.length; i++) {
      const window = candles.slice(i - lookback, i);
      const current = candles[i];

      const prevHigh = Math.max(...window.map((c) => c.high));
      const prevLow = Math.min(...window.map((c) => c.low));

      // Sweep above previous high then close below (bearish)
      if (current.high > prevHigh && current.close < prevHigh) {
        patterns.push({
          id: `ls-${symbol}-${i}-bear`,
          symbol,
          exchange,
          type: PatternType.LIQUIDITY_SWEEP,
          timeframe,
          confidence: 0.6,
          description: `Bearish liquidity sweep — swept above ${prevHigh.toFixed(2)} then rejected`,
          points: [
            { timestamp: window[window.length - 1].timestamp, price: prevHigh },
            { timestamp: current.timestamp, price: current.high },
            { timestamp: current.timestamp, price: current.close },
          ],
          direction: 'bearish',
          timestamp: current.timestamp,
        });
      }

      // Sweep below previous low then close above (bullish)
      if (current.low < prevLow && current.close > prevLow) {
        patterns.push({
          id: `ls-${symbol}-${i}-bull`,
          symbol,
          exchange,
          type: PatternType.LIQUIDITY_SWEEP,
          timeframe,
          confidence: 0.6,
          description: `Bullish liquidity sweep — swept below ${prevLow.toFixed(2)} then recovered`,
          points: [
            { timestamp: window[window.length - 1].timestamp, price: prevLow },
            { timestamp: current.timestamp, price: current.low },
            { timestamp: current.timestamp, price: current.close },
          ],
          direction: 'bullish',
          timestamp: current.timestamp,
        });
      }
    }

    return patterns.slice(-5);
  }

  // --- Utility: Linear regression slope ---
  private linearSlope(values: number[]): number {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return 0;
    return (n * sumXY - sumX * sumY) / denom;
  }

  // --- Utility: Find peaks ---
  private findPeaks(data: number[], distance: number): number[] {
    const peaks: number[] = [];
    for (let i = distance; i < data.length - distance; i++) {
      let isPeak = true;
      for (let j = 1; j <= distance; j++) {
        if (data[i] < data[i - j] || data[i] < data[i + j]) {
          isPeak = false;
          break;
        }
      }
      if (isPeak) peaks.push(i);
    }
    return peaks;
  }
}
