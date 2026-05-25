import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import {
  Exchange,
  SortDirection,
  ScreenerRequest,
  ScreenerFilter,
  Ticker,
  ScreenerPreset,
  PaginatedResponse,
} from '@crypto-screener/shared';

interface QuickFilter {
  type: string;
  label: string;
  description: string;
  filters: ScreenerFilter[];
  sortBy: string;
  sortDirection: SortDirection;
}

@Injectable()
export class ScreenerService {
  private readonly logger = new Logger(ScreenerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly marketData: MarketDataService,
  ) {}

  async filter(request: ScreenerRequest, userId?: string): Promise<PaginatedResponse<Ticker>> {
    const {
      filters = [],
      sortBy = 'quoteVolume24h',
      sortDirection = SortDirection.DESC,
      exchanges = [Exchange.BINANCE],
      page = 1,
      pageSize = 50,
      search,
    } = request;

    let tickers = await this.marketData.getAggregatedTickers(exchanges);

    if (search) {
      const searchLower = search.toLowerCase();
      tickers = tickers.filter((t) =>
        t.symbol.toLowerCase().includes(searchLower) ||
        t.normalizedSymbol.toLowerCase().includes(searchLower)
      );
    }

    for (const filter of filters) {
      tickers = this.applyFilter(tickers, filter);
    }

    tickers = this.sortTickers(tickers, sortBy, sortDirection);

    const total = tickers.length;
    const start = (page - 1) * pageSize;
    const items = tickers.slice(start, start + pageSize);
    const hasMore = start + pageSize < total;

    return { items, total, page, pageSize, hasMore };
  }

  private applyFilter(tickers: Ticker[], filter: ScreenerFilter): Ticker[] {
    const { field, operator, value } = filter;

    return tickers.filter((ticker) => {
      const fieldValue = this.getFieldValue(ticker, field);
      if (fieldValue === undefined || fieldValue === null) return false;

      switch (operator) {
        case 'gt':
          return fieldValue > (value as number);
        case 'lt':
          return fieldValue < (value as number);
        case 'gte':
          return fieldValue >= (value as number);
        case 'lte':
          return fieldValue <= (value as number);
        case 'eq':
          return fieldValue === (value as number);
        case 'between': {
          const [min, max] = value as [number, number];
          return fieldValue >= min && fieldValue <= max;
        }
        default:
          return true;
      }
    });
  }

  private getFieldValue(ticker: Ticker, field: string): number | undefined {
    const fieldMap: Record<string, number> = {
      price: ticker.price,
      priceChange24h: ticker.priceChange24h,
      priceChangePercent24h: ticker.priceChangePercent24h,
      volume24h: ticker.volume24h,
      quoteVolume24h: ticker.quoteVolume24h,
      trades24h: ticker.trades24h,
      high24h: ticker.high24h,
      low24h: ticker.low24h,
      spread: ticker.spread,
      volatility: ticker.high24h > 0
        ? ((ticker.high24h - ticker.low24h) / ticker.high24h) * 100
        : 0,
    };

    return fieldMap[field];
  }

  private sortTickers(tickers: Ticker[], sortBy: string, direction: SortDirection): Ticker[] {
    return [...tickers].sort((a, b) => {
      const aVal = this.getFieldValue(a, sortBy) || 0;
      const bVal = this.getFieldValue(b, sortBy) || 0;
      return direction === SortDirection.DESC ? bVal - aVal : aVal - bVal;
    });
  }

  async getPreset(id: string, userId: string): Promise<ScreenerPreset> {
    const preset = await this.prisma.screenerPreset.findFirst({
      where: { id, userId },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    return this.dbPresetToPreset(preset);
  }

  async savePreset(
    data: {
      name: string;
      filters?: ScreenerFilter[];
      sortBy?: string;
      sortDirection?: SortDirection;
    },
    userId: string,
  ): Promise<ScreenerPreset> {
    const preset = await this.prisma.screenerPreset.create({
      data: {
        userId,
        name: data.name,
        filters: (data.filters || []) as any,
        sortBy: data.sortBy || 'quoteVolume24h',
        sortDirection: data.sortDirection || SortDirection.DESC,
      },
    });

    return this.dbPresetToPreset(preset);
  }

  async deletePreset(id: string, userId: string): Promise<void> {
    const preset = await this.prisma.screenerPreset.findFirst({
      where: { id, userId },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    await this.prisma.screenerPreset.delete({ where: { id } });
  }

  async getPresets(userId: string): Promise<ScreenerPreset[]> {
    const presets = await this.prisma.screenerPreset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return presets.map((p: any) => this.dbPresetToPreset(p));
  }

  getQuickFilters(): QuickFilter[] {
    return [
      {
        type: 'top_gainers',
        label: 'Top Gainers',
        description: 'Symbols with highest price increase in 24h',
        filters: [{ field: 'priceChangePercent24h', operator: 'gt', value: 0 }],
        sortBy: 'priceChangePercent24h',
        sortDirection: SortDirection.DESC,
      },
      {
        type: 'top_losers',
        label: 'Top Losers',
        description: 'Symbols with highest price decrease in 24h',
        filters: [{ field: 'priceChangePercent24h', operator: 'lt', value: 0 }],
        sortBy: 'priceChangePercent24h',
        sortDirection: SortDirection.ASC,
      },
      {
        type: 'top_volume',
        label: 'Top Volume',
        description: 'Symbols with highest 24h volume',
        filters: [],
        sortBy: 'quoteVolume24h',
        sortDirection: SortDirection.DESC,
      },
      {
        type: 'high_volatility',
        label: 'High Volatility',
        description: 'Symbols with highest intraday volatility',
        filters: [{ field: 'volatility', operator: 'gt', value: 2 }],
        sortBy: 'volatility',
        sortDirection: SortDirection.DESC,
      },
      {
        type: 'most_trades',
        label: 'Most Trades',
        description: 'Symbols with most trades in 24h',
        filters: [],
        sortBy: 'trades24h',
        sortDirection: SortDirection.DESC,
      },
      {
        type: 'tight_spread',
        label: 'Tight Spread',
        description: 'Symbols with tightest bid/ask spread',
        filters: [{ field: 'spread', operator: 'gt', value: 0 }],
        sortBy: 'spread',
        sortDirection: SortDirection.ASC,
      },
      {
        type: 'big_movers',
        label: 'Big Movers (>5%)',
        description: 'Symbols that moved more than 5% in 24h',
        filters: [{ field: 'priceChangePercent24h', operator: 'between', value: [-100, -5] }],
        sortBy: 'priceChangePercent24h',
        sortDirection: SortDirection.ASC,
      },
      {
        type: 'new_listings',
        label: 'Low Price / High Volume',
        description: 'Low price tokens with high volume',
        filters: [
          { field: 'price', operator: 'lt', value: 1 },
          { field: 'quoteVolume24h', operator: 'gt', value: 1000000 },
        ],
        sortBy: 'quoteVolume24h',
        sortDirection: SortDirection.DESC,
      },
    ];
  }

  async executeQuickFilter(type: string, userId?: string): Promise<PaginatedResponse<Ticker>> {
    const quickFilters = this.getQuickFilters();
    const quickFilter = quickFilters.find((qf) => qf.type === type);

    if (!quickFilter) {
      throw new NotFoundException(`Quick filter '${type}' not found`);
    }

    return this.filter(
      {
        filters: quickFilter.filters,
        sortBy: quickFilter.sortBy,
        sortDirection: quickFilter.sortDirection,
        pageSize: 50,
      },
      userId,
    );
  }

  private dbPresetToPreset(p: any): ScreenerPreset {
    return {
      id: p.id,
      name: p.name,
      filters: (p.filters as unknown as ScreenerFilter[]) || [],
      sortBy: p.sortBy,
      sortDirection: p.sortDirection as SortDirection,
      createdAt: p.createdAt.getTime(),
    };
  }
}
