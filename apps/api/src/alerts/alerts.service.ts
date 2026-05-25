import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { ExchangeService } from '../exchange/exchange.service';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import {
  AlertType,
  AlertDelivery,
  Exchange,
  Ticker,
  DEFAULT_SYMBOLS,
} from '@crypto-screener/shared';

interface RuleCondition {
  field?: string;
  operator?: string;
  value?: number;
  threshold?: number;
  percentChange?: number;
  timeframe?: string;
  multiplier?: number;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private previousTickers = new Map<string, Ticker>();
  private previousVolumes = new Map<string, number>();
  private previousOI = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
    private readonly exchangeService: ExchangeService,
  ) {}

  async createAlert(data: {
    userId?: string;
    type: AlertType;
    symbol: string;
    exchange?: Exchange;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data?: Record<string, unknown>;
  }): Promise<any> {
    const alert = await this.prisma.alert.create({
      data: {
        userId: data.userId,
        type: data.type,
        symbol: data.symbol,
        exchange: data.exchange,
        title: data.title,
        message: data.message,
        severity: data.severity,
        data: (data.data || {}) as any,
      },
    });

    return {
      ...alert,
      createdAt: alert.createdAt.getTime(),
    };
  }

  async getAlerts(
    userId: string,
    unreadOnly: boolean = false,
    page: number = 1,
    pageSize: number = 50,
  ) {
    const where: any = { userId };
    if (unreadOnly) where.read = false;

    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      items: items.map((a: any) => ({
        ...a,
        createdAt: a.createdAt.getTime(),
      })),
      total,
      page,
      pageSize,
      hasMore: (page - 1) * pageSize + items.length < total,
    };
  }

  async markAsRead(id: string): Promise<void> {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');

    await this.prisma.alert.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.alert.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async createRule(data: {
    userId: string;
    type: AlertType;
    symbol?: string;
    exchange?: Exchange;
    condition: Record<string, unknown>;
    deliveries: AlertDelivery[];
    enabled?: boolean;
  }) {
    const rule = await this.prisma.alertRule.create({
      data: {
        userId: data.userId,
        type: data.type,
        symbol: data.symbol,
        exchange: data.exchange,
        condition: data.condition as any,
        deliveries: data.deliveries,
        enabled: data.enabled ?? true,
      },
    });

    return { ...rule, createdAt: rule.createdAt.getTime() };
  }

  async deleteRule(id: string, userId: string): Promise<void> {
    const rule = await this.prisma.alertRule.findFirst({
      where: { id, userId },
    });
    if (!rule) throw new NotFoundException('Alert rule not found');

    await this.prisma.alertRule.delete({ where: { id } });
  }

  async getRules(userId: string) {
    const rules = await this.prisma.alertRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return rules.map((r: any) => ({ ...r, createdAt: r.createdAt.getTime() }));
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async evaluateRules(): Promise<void> {
    try {
      const rules = await this.prisma.alertRule.findMany({
        where: { enabled: true },
      });

      if (rules.length === 0) return;

      const tickers = await this.marketData.getAggregatedTickers([Exchange.BINANCE]);
      const tickerMap = new Map(tickers.map((t) => [t.symbol, t]));

      for (const rule of rules) {
        try {
          await this.evaluateRule(rule, tickerMap);
        } catch (err) {
          this.logger.warn(`Rule evaluation error for ${rule.id}: ${err}`);
        }
      }

      // Update previous state for next evaluation
      for (const ticker of tickers) {
        this.previousTickers.set(ticker.symbol, ticker);
        this.previousVolumes.set(ticker.symbol, ticker.quoteVolume24h);
      }
    } catch (err) {
      this.logger.warn('Alert evaluation error:', err);
    }
  }

  private async evaluateRule(
    rule: any,
    tickerMap: Map<string, Ticker>,
  ): Promise<void> {
    const condition = rule.condition as RuleCondition;
    const symbols = rule.symbol ? [rule.symbol] : DEFAULT_SYMBOLS.slice(0, 20);

    for (const symbol of symbols) {
      const ticker = tickerMap.get(symbol);
      if (!ticker) continue;

      const prev = this.previousTickers.get(symbol);

      switch (rule.type as AlertType) {
        case AlertType.PRICE_CROSS:
          await this.checkPriceCross(rule, ticker, condition);
          break;
        case AlertType.VOLUME_SPIKE:
          await this.checkVolumeSpike(rule, ticker, symbol);
          break;
        case AlertType.VOLATILITY_SPIKE:
          await this.checkVolatilitySpike(rule, ticker, condition);
          break;
        case AlertType.PUMP:
          await this.checkPump(rule, ticker, prev);
          break;
        case AlertType.DUMP:
          await this.checkDump(rule, ticker, prev);
          break;
        case AlertType.BREAKOUT:
          await this.checkBreakout(rule, ticker, condition);
          break;
        case AlertType.FUNDING_ANOMALY:
          await this.checkFundingAnomaly(rule, symbol);
          break;
        case AlertType.OI_SPIKE:
          await this.checkOISpike(rule, symbol);
          break;
        case AlertType.WHALE_ALERT:
          await this.checkWhaleAlert(rule, ticker, condition);
          break;
      }
    }
  }

  private async checkPriceCross(
    rule: any,
    ticker: Ticker,
    condition: RuleCondition,
  ): Promise<void> {
    const threshold = condition.threshold || condition.value;
    if (!threshold) return;

    const prev = this.previousTickers.get(ticker.symbol);
    if (!prev) return;

    const crossedUp = prev.price < threshold && ticker.price >= threshold;
    const crossedDown = prev.price > threshold && ticker.price <= threshold;

    if (crossedUp || crossedDown) {
      const direction = crossedUp ? 'above' : 'below';
      await this.createAlert({
        userId: rule.userId,
        type: AlertType.PRICE_CROSS,
        symbol: ticker.symbol,
        exchange: ticker.exchange,
        title: `Price Cross: ${ticker.symbol}`,
        message: `${ticker.symbol} crossed ${direction} $${threshold} at $${ticker.price.toFixed(4)}`,
        severity: 'medium',
        data: { price: ticker.price, threshold, direction },
      });
    }
  }

  private async checkVolumeSpike(rule: any, ticker: Ticker, symbol: string): Promise<void> {
    const condition = rule.condition as RuleCondition;
    const multiplier = condition.multiplier || 3;
    const prevVolume = this.previousVolumes.get(symbol);

    if (prevVolume && prevVolume > 0) {
      const ratio = ticker.quoteVolume24h / prevVolume;
      if (ratio >= multiplier) {
        await this.createAlert({
          userId: rule.userId,
          type: AlertType.VOLUME_SPIKE,
          symbol: ticker.symbol,
          exchange: ticker.exchange,
          title: `Volume Spike: ${ticker.symbol}`,
          message: `${ticker.symbol} volume surged ${ratio.toFixed(1)}x ($${(ticker.quoteVolume24h / 1e6).toFixed(2)}M)`,
          severity: ratio >= 5 ? 'high' : 'medium',
          data: { volume: ticker.quoteVolume24h, previousVolume: prevVolume, ratio },
        });
      }
    }
  }

  private async checkVolatilitySpike(
    rule: any,
    ticker: Ticker,
    condition: RuleCondition,
  ): Promise<void> {
    const volatility =
      ticker.high24h > 0
        ? ((ticker.high24h - ticker.low24h) / ticker.high24h) * 100
        : 0;

    const threshold = condition.threshold || 5;
    if (volatility >= threshold) {
      await this.createAlert({
        userId: rule.userId,
        type: AlertType.VOLATILITY_SPIKE,
        symbol: ticker.symbol,
        exchange: ticker.exchange,
        title: `High Volatility: ${ticker.symbol}`,
        message: `${ticker.symbol} volatility at ${volatility.toFixed(2)}% (H: $${ticker.high24h.toFixed(4)} / L: $${ticker.low24h.toFixed(4)})`,
        severity: volatility >= 10 ? 'high' : 'medium',
        data: { volatility, high: ticker.high24h, low: ticker.low24h },
      });
    }
  }

  private async checkPump(rule: any, ticker: Ticker, prev?: Ticker): Promise<void> {
    const condition = rule.condition as RuleCondition;
    const threshold = condition.percentChange || 10;

    if (ticker.priceChangePercent24h >= threshold) {
      await this.createAlert({
        userId: rule.userId,
        type: AlertType.PUMP,
        symbol: ticker.symbol,
        exchange: ticker.exchange,
        title: `PUMP Alert: ${ticker.symbol}`,
        message: `${ticker.symbol} pumped +${ticker.priceChangePercent24h.toFixed(2)}% in 24h to $${ticker.price.toFixed(4)}`,
        severity: ticker.priceChangePercent24h >= 20 ? 'critical' : 'high',
        data: {
          price: ticker.price,
          change: ticker.priceChangePercent24h,
          volume: ticker.quoteVolume24h,
        },
      });
    }
  }

  private async checkDump(rule: any, ticker: Ticker, prev?: Ticker): Promise<void> {
    const condition = rule.condition as RuleCondition;
    const threshold = condition.percentChange || -10;

    if (ticker.priceChangePercent24h <= threshold) {
      await this.createAlert({
        userId: rule.userId,
        type: AlertType.DUMP,
        symbol: ticker.symbol,
        exchange: ticker.exchange,
        title: `DUMP Alert: ${ticker.symbol}`,
        message: `${ticker.symbol} dumped ${ticker.priceChangePercent24h.toFixed(2)}% in 24h to $${ticker.price.toFixed(4)}`,
        severity: ticker.priceChangePercent24h <= -20 ? 'critical' : 'high',
        data: {
          price: ticker.price,
          change: ticker.priceChangePercent24h,
          volume: ticker.quoteVolume24h,
        },
      });
    }
  }

  private async checkBreakout(
    rule: any,
    ticker: Ticker,
    condition: RuleCondition,
  ): Promise<void> {
    const prev = this.previousTickers.get(ticker.symbol);
    if (!prev) return;

    const resistanceThreshold = condition.threshold;
    if (!resistanceThreshold) return;

    if (prev.price < resistanceThreshold && ticker.price >= resistanceThreshold) {
      await this.createAlert({
        userId: rule.userId,
        type: AlertType.BREAKOUT,
        symbol: ticker.symbol,
        exchange: ticker.exchange,
        title: `Breakout: ${ticker.symbol}`,
        message: `${ticker.symbol} broke above resistance at $${resistanceThreshold} (now $${ticker.price.toFixed(4)})`,
        severity: 'high',
        data: {
          price: ticker.price,
          resistance: resistanceThreshold,
          change: ticker.priceChangePercent24h,
        },
      });
    }
  }

  private async checkFundingAnomaly(rule: any, symbol: string): Promise<void> {
    const condition = rule.condition as RuleCondition;
    const threshold = condition.threshold || 0.01;

    try {
      const funding = await this.exchangeService.getFundingRate(Exchange.BINANCE, symbol);

      if (Math.abs(funding.rate) >= threshold) {
        const direction = funding.rate > 0 ? 'positive (longs pay shorts)' : 'negative (shorts pay longs)';
        await this.createAlert({
          userId: rule.userId,
          type: AlertType.FUNDING_ANOMALY,
          symbol,
          exchange: Exchange.BINANCE,
          title: `Funding Anomaly: ${symbol}`,
          message: `${symbol} funding rate is ${(funding.rate * 100).toFixed(4)}% (${direction})`,
          severity: Math.abs(funding.rate) >= 0.03 ? 'high' : 'medium',
          data: { fundingRate: funding.rate },
        });
      }
    } catch {
      // Exchange may not support funding rates
    }
  }

  private async checkOISpike(rule: any, symbol: string): Promise<void> {
    const condition = rule.condition as RuleCondition;
    const multiplier = condition.multiplier || 2;

    try {
      const oi = await this.exchangeService.getOpenInterest(Exchange.BINANCE, symbol);
      const prevOI = this.previousOI.get(symbol);

      if (prevOI && prevOI > 0) {
        const ratio = oi.value / prevOI;
        if (ratio >= multiplier) {
          await this.createAlert({
            userId: rule.userId,
            type: AlertType.OI_SPIKE,
            symbol,
            exchange: Exchange.BINANCE,
            title: `OI Spike: ${symbol}`,
            message: `${symbol} open interest surged ${ratio.toFixed(1)}x to $${(oi.value / 1e6).toFixed(2)}M`,
            severity: ratio >= 3 ? 'high' : 'medium',
            data: { openInterest: oi.value, previousOI: prevOI, ratio },
          });
        }
      }

      this.previousOI.set(symbol, oi.value);
    } catch {
      // Exchange may not support OI
    }
  }

  private async checkWhaleAlert(
    rule: any,
    ticker: Ticker,
    condition: RuleCondition,
  ): Promise<void> {
    const volumeThreshold = condition.value || 50000000; // $50M default

    if (ticker.quoteVolume24h >= volumeThreshold) {
      await this.createAlert({
        userId: rule.userId,
        type: AlertType.WHALE_ALERT,
        symbol: ticker.symbol,
        exchange: ticker.exchange,
        title: `Whale Activity: ${ticker.symbol}`,
        message: `${ticker.symbol} has unusual volume: $${(ticker.quoteVolume24h / 1e6).toFixed(2)}M in 24h`,
        severity: 'medium',
        data: { volume: ticker.quoteVolume24h, price: ticker.price },
      });
    }
  }
}
