// Local copy of @crypto-screener/shared types
// (to avoid monorepo dependency in production builds)

export enum Exchange {
  BINANCE = 'binance',
  BYBIT = 'bybit',
  OKX = 'okx',
  KUCOIN = 'kucoin',
  BITGET = 'bitget',
  GATE = 'gate',
  MEXC = 'mexc',
  HYPERLIQUID = 'hyperliquid',
  COINBASE = 'coinbase',
}

export enum Timeframe {
  M1 = '1m',
  M5 = '5m',
  M15 = '15m',
  M30 = '30m',
  H1 = '1h',
  H2 = '2h',
  H4 = '4h',
  H6 = '6h',
  H8 = '8h',
  H12 = '12h',
  D1 = '1d',
  D3 = '3d',
  W1 = '1w',
  MN = '1M',
}

export enum AlertType {
  PRICE_CROSS = 'price_cross',
  VOLUME_SPIKE = 'volume_spike',
  VOLATILITY_SPIKE = 'volatility_spike',
  PUMP = 'pump',
  DUMP = 'dump',
  BREAKOUT = 'breakout',
  FUNDING_ANOMALY = 'funding_anomaly',
  OI_SPIKE = 'oi_spike',
  WHALE_ALERT = 'whale_alert',
}

export enum AlertDelivery {
  IN_APP = 'in_app',
  TELEGRAM = 'telegram',
  WEBHOOK = 'webhook',
}

export enum PatternType {
  SUPPORT = 'support',
  RESISTANCE = 'resistance',
  TRIANGLE = 'triangle',
  WEDGE = 'wedge',
  FLAG = 'flag',
  CHANNEL = 'channel',
  DOUBLE_TOP = 'double_top',
  DOUBLE_BOTTOM = 'double_bottom',
  HEAD_SHOULDERS = 'head_shoulders',
  BREAKOUT = 'breakout',
  BOS = 'bos',
  CHOCH = 'choch',
  FVG = 'fvg',
  ORDER_BLOCK = 'order_block',
  LIQUIDITY_SWEEP = 'liquidity_sweep',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export const DEFAULT_SYMBOLS = [
  'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT',
  'DOGE/USDT', 'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT',
  'MATIC/USDT', 'UNI/USDT', 'ATOM/USDT', 'LTC/USDT', 'FIL/USDT',
  'NEAR/USDT', 'APT/USDT', 'ARB/USDT', 'OP/USDT', 'SUI/USDT',
  'PEPE/USDT', 'SHIB/USDT', 'TRX/USDT', 'TON/USDT', 'AAVE/USDT',
  'MKR/USDT', 'CRV/USDT', 'DYDX/USDT', 'INJ/USDT', 'TIA/USDT',
];

export interface Candle {
  symbol?: string;
  exchange?: Exchange;
  timeframe?: Timeframe;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  buyVolume: number;
  sellVolume: number;
}

export interface Ticker {
  symbol: string;
  normalizedSymbol: string;
  exchange: Exchange;
  marketType: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  quoteVolume24h: number;
  trades24h: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  spread: number;
  lastUpdate: number;
}

export interface OrderBookLevel {
  price: number;
  amount?: number;
  quantity: number;
  count: number;
}

export interface OrderBook {
  symbol: string;
  exchange: Exchange;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface FundingRate {
  symbol: string;
  exchange: Exchange;
  rate: number;
  nextTime?: number;
  nextFundingTime: number;
  timestamp: number;
}

export interface OpenInterest {
  symbol: string;
  exchange: Exchange;
  value: number;
  valueChange24h: number;
  valueChangePercent24h?: number;
  timestamp: number;
}

export interface Trade {
  id?: string;
  symbol: string;
  exchange: Exchange;
  side: 'buy' | 'sell';
  price: number;
  amount?: number;
  quantity: number;
  timestamp: number;
  isLiquidation?: boolean;
}

export interface DetectedPattern {
  id?: string;
  type: PatternType;
  symbol: string;
  exchange: Exchange;
  timeframe: Timeframe;
  confidence: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  points: { timestamp: number; price: number }[];
  description: string;
  timestamp: number;
  targetPrice?: number | null;
  stopLoss?: number | null;
}

export interface ScreenerFilter {
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
  value: number | [number, number];
}

export interface ScreenerRequest {
  filters?: ScreenerFilter[];
  sortBy?: string;
  sortDirection?: SortDirection;
  exchanges?: Exchange[];
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ScreenerPreset {
  id?: string;
  name: string;
  filters?: ScreenerFilter[];
  sortBy?: string;
  sortDirection?: SortDirection;
  createdAt?: number;
}

export interface PaginatedResponse<T> {
  data?: T[];
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
  hasMore: boolean;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  defaultExchange: Exchange;
  defaultTimeframe: Timeframe;
  defaultChartCount: number;
  notifications: {
    sound: boolean;
    desktop: boolean;
    telegram: boolean;
  };
  chart: {
    candleStyle: 'candles' | 'line' | 'area';
    showVolume: boolean;
    showLiquidity: boolean;
    showPatterns: boolean;
    showOverlays: boolean;
  };
  layout: 'grid' | 'single';
}

export interface LiquidityLevel {
  price: number;
  quantity: number;
  side: 'bid' | 'ask';
  type: 'limit' | 'spoof' | 'iceberg' | 'absorption';
  confidence: number;
  timestamp: number;
  bidVolume?: number;
  askVolume?: number;
  totalVolume?: number;
  imbalance?: number;
}

export interface LiquidityHeatmapData {
  symbol: string;
  exchange: Exchange;
  levels: LiquidityLevel[];
  timestamp: number;
}

export interface WSEvent<T> {
  event: string;
  data: T;
  timestamp: number;
}

export interface WSTickerUpdate {
  symbol: string;
  ticker: Ticker;
}

export interface WSCandleUpdate {
  symbol: string;
  exchange: Exchange;
  timeframe: Timeframe;
  candle: Candle;
}

export interface WSOrderBookUpdate {
  symbol: string;
  exchange: Exchange;
  orderBook: OrderBook;
}

export interface WSTradeUpdate {
  symbol: string;
  exchange: Exchange;
  trade: Trade;
}

export interface WSAlert {
  alert: {
    existing: true;
    id: string;
    type: AlertType;
    symbol: string;
    exchange: Exchange;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
  };
}
