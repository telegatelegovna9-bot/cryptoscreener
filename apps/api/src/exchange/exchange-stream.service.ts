import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import type { Candle, Exchange, Timeframe } from '@crypto-screener/shared';

export interface StreamCandleUpdate {
  symbol: string;
  exchange: Exchange;
  timeframe: Timeframe;
  candle: Candle;
}

type CandleCallback = (update: StreamCandleUpdate) => void;

interface StreamState {
  ws: WebSocket | null;
  subscriptions: Map<string, CandleCallback[]>; // key: "SYMBOL:TF"
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  pingTimer: ReturnType<typeof setInterval> | null;
  reconnectAttempts: number;
}

const WS_EXCHANGES = new Set(['binance', 'bybit', 'okx']);

@Injectable()
export class ExchangeStreamService implements OnModuleDestroy {
  private readonly logger = new Logger(ExchangeStreamService.name);
  // Keyed by connectionKey: "exchange" for spot, "exchange:futures" for perpetual
  private readonly streams = new Map<string, StreamState>();

  async onModuleDestroy(): Promise<void> {
    for (const [key] of this.streams) {
      this.disconnect(key);
    }
    this.streams.clear();
  }

  supportsStreaming(exchange: string): boolean {
    return WS_EXCHANGES.has(exchange);
  }

  /** Spot symbols are plain (BTCUSDT), futures/perpetual contain ':' (BTCUSDT:USDT) */
  private isFuturesSymbol(symbol: string): boolean {
    return symbol.includes(':');
  }

  /** Connection key separates spot and futures WS connections */
  private getConnectionKey(exchange: string, symbol: string): string {
    return this.isFuturesSymbol(symbol) ? `${exchange}:futures` : exchange;
  }

  /** Extract base exchange name from connectionKey (e.g. "binance:futures" → "binance") */
  private baseExchange(connectionKey: string): string {
    return connectionKey.split(':')[0];
  }

  subscribe(
    symbol: string,
    exchange: string,
    timeframe: string,
    callback: CandleCallback,
  ): boolean {
    if (!this.supportsStreaming(exchange)) return false;

    const key = `${symbol}:${timeframe}`;
    const connectionKey = this.getConnectionKey(exchange, symbol);

    if (!this.streams.has(connectionKey)) {
      this.streams.set(connectionKey, {
        ws: null,
        subscriptions: new Map(),
        reconnectTimer: null,
        pingTimer: null,
        reconnectAttempts: 0,
      });
    }

    const state = this.streams.get(connectionKey)!;

    if (!state.subscriptions.has(key)) {
      state.subscriptions.set(key, []);
    }
    state.subscriptions.get(key)!.push(callback);

    if (!state.ws || state.ws.readyState === WebSocket.CLOSED) {
      this.connect(connectionKey);
    } else if (state.ws.readyState === WebSocket.OPEN) {
      this.sendSubscribe(connectionKey, symbol, timeframe);
    }

    return true;
  }

  unsubscribe(symbol: string, exchange: string, timeframe: string): void {
    const connectionKey = this.getConnectionKey(exchange, symbol);
    const state = this.streams.get(connectionKey);
    if (!state) return;

    const key = `${symbol}:${timeframe}`;
    state.subscriptions.delete(key);

    this.sendUnsubscribe(connectionKey, symbol, timeframe);

    if (state.subscriptions.size === 0) {
      this.disconnect(connectionKey);
      this.streams.delete(connectionKey);
    }
  }

  private connect(connectionKey: string): void {
    const state = this.streams.get(connectionKey);
    if (!state) return;

    const ex = this.baseExchange(connectionKey);
    const isFutures = connectionKey.includes(':futures');
    const url = this.getWsUrl(ex, isFutures);
    if (!url) return;

    this.logger.log(`Connecting to ${connectionKey} WS: ${url}`);

    try {
      const ws = new WebSocket(url);
      state.ws = ws;

      ws.on('open', () => {
        this.logger.log(`Connected to ${connectionKey} WS`);
        state.reconnectAttempts = 0;

        for (const key of state.subscriptions.keys()) {
          const [symbol, tf] = this.parseKey(key);
          this.sendSubscribe(connectionKey, symbol, tf);
        }

        this.startPing(connectionKey);
      });

      ws.on('message', (data: Buffer) => {
        try {
          const raw = data.toString();
          // OKX ping/pong
          if (raw === 'pong' || raw === 'ping') {
            if (raw === 'ping') ws.send('pong');
            return;
          }
          const msg = JSON.parse(raw);
          this.handleMessage(connectionKey, msg);
        } catch {
          // ignore parse errors
        }
      });

      ws.on('close', (code: number) => {
        this.logger.warn(`${connectionKey} WS closed (code: ${code})`);
        this.stopPing(connectionKey);
        state.ws = null;
        this.scheduleReconnect(connectionKey);
      });

      ws.on('error', (err) => {
        this.logger.warn(`${connectionKey} WS error: ${err.message}`);
      });
    } catch (err) {
      this.logger.warn(`Failed to connect to ${connectionKey}: ${err}`);
      this.scheduleReconnect(connectionKey);
    }
  }

  private disconnect(connectionKey: string): void {
    const state = this.streams.get(connectionKey);
    if (!state) return;

    this.stopPing(connectionKey);

    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }

    if (state.ws) {
      try { state.ws.terminate(); } catch {}
      state.ws = null;
    }
  }

  private scheduleReconnect(connectionKey: string): void {
    const state = this.streams.get(connectionKey);
    if (!state || state.reconnectTimer) return;
    if (state.subscriptions.size === 0) return;

    const delay = Math.min(1000 * Math.pow(2, state.reconnectAttempts), 30000);
    state.reconnectAttempts++;

    this.logger.log(`Reconnecting to ${connectionKey} in ${delay}ms (attempt ${state.reconnectAttempts})`);

    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      this.connect(connectionKey);
    }, delay);
  }

  private startPing(connectionKey: string): void {
    const state = this.streams.get(connectionKey);
    if (!state) return;

    this.stopPing(connectionKey);

    const ex = this.baseExchange(connectionKey);
    state.pingTimer = setInterval(() => {
      if (state.ws?.readyState === WebSocket.OPEN) {
        try {
          if (ex === 'okx') {
            state.ws.send('ping');
          } else {
            state.ws.ping();
          }
        } catch {}
      }
    }, 20000);
  }

  private stopPing(connectionKey: string): void {
    const state = this.streams.get(connectionKey);
    if (state?.pingTimer) {
      clearInterval(state.pingTimer);
      state.pingTimer = null;
    }
  }

  private sendSubscribe(connectionKey: string, symbol: string, timeframe: string): void {
    const state = this.streams.get(connectionKey);
    if (!state?.ws || state.ws.readyState !== WebSocket.OPEN) return;

    const ex = this.baseExchange(connectionKey);
    const msg = this.buildSubscribeMsg(ex, symbol, timeframe);
    if (msg) {
      this.logger.debug(`Subscribing: ${connectionKey} ${symbol} ${timeframe}`);
      state.ws.send(JSON.stringify(msg));
    }
  }

  private sendUnsubscribe(connectionKey: string, symbol: string, timeframe: string): void {
    const state = this.streams.get(connectionKey);
    if (!state?.ws || state.ws.readyState !== WebSocket.OPEN) return;

    const ex = this.baseExchange(connectionKey);
    const msg = this.buildUnsubscribeMsg(ex, symbol, timeframe);
    if (msg) {
      state.ws.send(JSON.stringify(msg));
    }
  }

  private parseKey(key: string): [string, string] {
    // Key is "SYMBOL:TF" but symbol might contain ":" (e.g., "BTCUSDT:USDT")
    // TF is always last part after the final ":"
    const lastColon = key.lastIndexOf(':');
    if (lastColon === -1) return [key, '1h'];
    return [key.substring(0, lastColon), key.substring(lastColon + 1)];
  }

  // ── Exchange URLs ──

  private getWsUrl(exchange: string, isFutures?: boolean): string | null {
    switch (exchange) {
      case 'binance':
        return isFutures
          ? 'wss://fstream.binance.com/market/stream'
          : 'wss://stream.binance.com:9443/stream';
      case 'bybit':
        return isFutures
          ? 'wss://stream.bybit.com/v5/public/linear'
          : 'wss://stream.bybit.com/v5/public/spot';
      case 'okx':
        return 'wss://ws.okx.com:8443/ws/v5/business';
      default:
        return null;
    }
  }

  // ── Subscribe/Unsubscribe messages ──

  private buildSubscribeMsg(exchange: string, symbol: string, tf: string): any {
    switch (exchange) {
      case 'binance':
        return {
          method: 'SUBSCRIBE',
          params: [`${this.binanceSymbol(symbol)}@kline_${this.binanceTf(tf)}`],
          id: Date.now(),
        };
      case 'bybit':
        return {
          op: 'subscribe',
          args: [`kline.${this.bybitTf(tf)}.${this.bybitSymbol(symbol)}`],
        };
      case 'okx':
        return {
          op: 'subscribe',
          args: [{ channel: `candle${this.okxTf(tf)}`, instId: this.okxSymbol(symbol) }],
        };
      default:
        return null;
    }
  }

  private buildUnsubscribeMsg(exchange: string, symbol: string, tf: string): any {
    switch (exchange) {
      case 'binance':
        return {
          method: 'UNSUBSCRIBE',
          params: [`${this.binanceSymbol(symbol)}@kline_${this.binanceTf(tf)}`],
          id: Date.now(),
        };
      case 'bybit':
        return {
          op: 'unsubscribe',
          args: [`kline.${this.bybitTf(tf)}.${this.bybitSymbol(symbol)}`],
        };
      case 'okx':
        return {
          op: 'unsubscribe',
          args: [{ channel: `candle${this.okxTf(tf)}`, instId: this.okxSymbol(symbol) }],
        };
      default:
        return null;
    }
  }

  // ── Message handlers ──

  private handleMessage(connectionKey: string, msg: any): void {
    // Log exchange error messages
    if (msg.code && msg.msg) {
      this.logger.warn(`[${connectionKey}] WS error: code=${msg.code} msg=${msg.msg}`);
      return;
    }
    if (msg.ret_code !== undefined && msg.ret_code !== 0) {
      this.logger.warn(`[${connectionKey}] WS error: ret_code=${msg.ret_code} ret_msg=${msg.ret_msg}`);
      return;
    }
    if (msg.event === 'error') {
      this.logger.warn(`[${connectionKey}] WS error: ${JSON.stringify(msg)}`);
      return;
    }

    // Ignore subscription confirmations
    if (msg.result !== undefined || msg.id !== undefined) return;
    if (msg.success !== undefined || msg.ret_msg !== undefined) return;
    if (msg.event === 'subscribe' || msg.event === 'unsubscribe') return;

    const ex = this.baseExchange(connectionKey);
    switch (ex) {
      case 'binance':
        this.handleBinance(connectionKey, msg);
        break;
      case 'bybit':
        this.handleBybit(connectionKey, msg);
        break;
      case 'okx':
        this.handleOkx(connectionKey, msg);
        break;
    }
  }

  private handleBinance(connectionKey: string, msg: any): void {
    // Binance combined stream format: {stream: "btcusdt@kline_1h", data: {e:"kline", ...}}
    let data = msg;

    // Unwrap combined stream envelope
    if (msg.stream && msg.data) {
      data = msg.data;
    }

    if (data.e !== 'kline') return;

    const k = data.k;
    if (!k) return;

    const rawSymbol = k.s; // "BTCUSDT"
    // For futures, append :USDT to match subscription key
    const isFutures = connectionKey.includes(':futures');
    const symbol = isFutures ? `${rawSymbol}:USDT` : rawSymbol;
    const tf = this.binanceTfToStandard(k.i);
    const key = `${symbol}:${tf}`;

    const state = this.streams.get(connectionKey);
    if (!state) return;

    const callbacks = state.subscriptions.get(key);
    if (!callbacks?.length) return;

    const candle: Candle = {
      timestamp: k.t,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      trades: k.n || 0,
      buyVolume: parseFloat(k.V || '0'),
      sellVolume: parseFloat(k.v) - parseFloat(k.V || '0'),
    };

    const update: StreamCandleUpdate = {
      symbol,
      exchange: 'binance' as Exchange,
      timeframe: tf as Timeframe,
      candle,
    };

    for (const cb of callbacks) {
      try { cb(update); } catch {}
    }
  }

  private handleBybit(connectionKey: string, msg: any): void {
    // Bybit V5: {topic: "kline.1.BTCUSDT", type: "snapshot", data: [{start, end, interval, open, high, low, close, volume, confirm, timestamp}]}
    if (!msg.topic?.startsWith('kline.')) return;

    const d = msg.data?.[0];
    if (!d) return;

    const parts = msg.topic.split('.');
    const bybitTf = parts[1]; // "1", "5", "15", "60", "240", "D", "W"
    const rawSymbol = parts[2]; // "BTCUSDT"
    const isFutures = connectionKey.includes(':futures');
    const symbol = isFutures ? `${rawSymbol}:USDT` : rawSymbol;
    const tf = this.bybitTfToStandard(bybitTf);
    const key = `${symbol}:${tf}`;

    const state = this.streams.get(connectionKey);
    if (!state) return;

    const callbacks = state.subscriptions.get(key);
    if (!callbacks?.length) return;

    const candle: Candle = {
      timestamp: typeof d.start === 'string' ? new Date(d.start).getTime() : Number(d.start),
      open: parseFloat(d.open),
      high: parseFloat(d.high),
      low: parseFloat(d.low),
      close: parseFloat(d.close),
      volume: parseFloat(d.volume),
      trades: 0,
      buyVolume: 0,
      sellVolume: 0,
    };

    const update: StreamCandleUpdate = {
      symbol,
      exchange: 'bybit' as Exchange,
      timeframe: tf as Timeframe,
      candle,
    };

    for (const cb of callbacks) {
      try { cb(update); } catch {}
    }
  }

  private handleOkx(connectionKey: string, msg: any): void {
    // OKX: {arg: {channel: "candle1m", instId: "BTC-USDT"|"BTC-USDT-SWAP"}, data: [[ts, o, h, l, c, vol, volCcy, volCcyQuote, confirm]]}
    if (!msg.arg?.channel?.startsWith('candle')) return;
    if (!msg.data?.[0]) return;

    const channel = msg.arg.channel; // "candle1m", "candle1H", etc.
    const okxTf = channel.replace('candle', '');
    const instId = msg.arg.instId; // "BTC-USDT" or "BTC-USDT-SWAP"
    const isFutures = connectionKey.includes(':futures') || instId.endsWith('-SWAP');

    // Parse instId: "BTC-USDT" → "BTCUSDT", "BTC-USDT-SWAP" → "BTCUSDT:USDT"
    let symbol: string;
    if (instId.endsWith('-SWAP')) {
      // Strip -SWAP, remove dashes, append :USDT
      const base = instId.slice(0, -5).replace('-', '');
      symbol = `${base}:USDT`;
    } else {
      symbol = instId.replace('-', '');
    }

    const tf = this.okxTfToStandard(okxTf);
    const key = `${symbol}:${tf}`;

    const state = this.streams.get(connectionKey);
    if (!state) return;

    const callbacks = state.subscriptions.get(key);
    if (!callbacks?.length) return;

    const d = msg.data[0];
    const candle: Candle = {
      timestamp: parseInt(d[0]), // ms
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
      trades: 0,
      buyVolume: 0,
      sellVolume: 0,
    };

    const update: StreamCandleUpdate = {
      symbol,
      exchange: 'okx' as Exchange,
      timeframe: tf as Timeframe,
      candle,
    };

    for (const cb of callbacks) {
      try { cb(update); } catch {}
    }
  }

  // ── Symbol converters ──

  private binanceSymbol(symbol: string): string {
    return symbol.split(':')[0].toLowerCase();
  }

  private bybitSymbol(symbol: string): string {
    return symbol.split(':')[0];
  }

  private okxSymbol(symbol: string): string {
    const s = symbol.split(':')[0];
    const quotes = ['USDT', 'USDC', 'BTC', 'ETH', 'BUSD'];
    for (const q of quotes) {
      if (s.endsWith(q) && s.length > q.length) {
        const base = s.slice(0, s.length - q.length);
        // For perpetual/futures symbols, use SWAP instrument ID
        return symbol.includes(':') ? `${base}-${q}-SWAP` : `${base}-${q}`;
      }
    }
    return s;
  }

  // ── Timeframe converters ──

  private binanceTf(tf: string): string {
    return tf; // Same: 1m, 5m, 15m, 1h, 4h, 1d, 1w
  }

  private binanceTfToStandard(btf: string): string {
    return btf;
  }

  private bybitTf(tf: string): string {
    const map: Record<string, string> = {
      '1m': '1', '5m': '5', '15m': '15',
      '1h': '60', '4h': '240',
      '1d': 'D', '1w': 'W',
    };
    return map[tf] || '60';
  }

  private bybitTfToStandard(btf: string): string {
    const map: Record<string, string> = {
      '1': '1m', '5': '5m', '15': '15m',
      '60': '1h', '240': '4h',
      'D': '1d', 'W': '1w',
    };
    return map[btf] || '1h';
  }

  private okxTf(tf: string): string {
    const map: Record<string, string> = {
      '1m': '1m', '5m': '5m', '15m': '15m',
      '1h': '1H', '4h': '4H',
      '1d': '1D', '1w': '1W',
    };
    return map[tf] || '1H';
  }

  private okxTfToStandard(otf: string): string {
    const map: Record<string, string> = {
      '1m': '1m', '5m': '5m', '15m': '15m',
      '1H': '1h', '4H': '4h',
      '1D': '1d', '1W': '1w',
    };
    return map[otf] || '1h';
  }
}
