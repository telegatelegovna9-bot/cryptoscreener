import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../redis/redis.service';
import { ExchangeService } from '../exchange/exchange.service';
import { ExchangeStreamService } from '../exchange/exchange-stream.service';
import {
  WSEvent,
  WSTickerUpdate,
  WSCandleUpdate,
  WSOrderBookUpdate,
  WSTradeUpdate,
  WSAlert,
} from '@crypto-screener/shared';

interface RateLimitState {
  count: number;
  windowStart: number;
}

interface CandlePollState {
  symbol: string;
  exchange: string;
  timeframe: string;
  timer: ReturnType<typeof setInterval>;
  lastTimestamp: number;
  lastCandle?: { open: number; high: number; low: number; close: number; volume: number };
}

@NestWebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class WebSocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly rateLimits = new Map<string, RateLimitState>();
  private readonly HEARTBEAT_INTERVAL = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10);
  private readonly MAX_CONNECTIONS_PER_IP = parseInt(process.env.WS_MAX_CONNECTIONS_PER_IP || '10', 10);
  private readonly RATE_LIMIT_WINDOW = 60000;
  private readonly RATE_LIMIT_MAX = 100;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly connectionCounts = new Map<string, number>();

  // REST polling fallback for non-streaming exchanges
  private readonly candlePolls = new Map<string, CandlePollState>();
  // Track WS-streamed channels
  private readonly streamedChannels = new Set<string>();

  constructor(
    private readonly authService: AuthService,
    private readonly redis: RedisService,
    private readonly exchangeService: ExchangeService,
    private readonly exchangeStream: ExchangeStreamService,
  ) {}

  afterInit(server: Server): void {
    this.logger.log('WebSocket gateway initialized');

    this.heartbeatTimer = setInterval(() => {
      try {
        const now = Date.now();
        const sockets = this.server?.sockets?.sockets;
        if (!sockets || typeof sockets[Symbol.iterator] !== 'function') return;
        for (const [id, socket] of sockets) {
          const data = (socket as any).__lastPing;
          if (data && now - data > this.HEARTBEAT_INTERVAL * 2) {
            this.logger.warn(`Disconnecting stale client ${id}`);
            socket.disconnect(true);
          }
        }
      } catch (err) {
        this.logger.warn(`Heartbeat error: ${err}`);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private startCandleStream(symbol: string, exchange: string, timeframe: string): void {
    const key = `${symbol}:${exchange}:${timeframe}`;
    if (this.streamedChannels.has(key) || this.candlePolls.has(key)) return;

    // Try direct WebSocket streaming first
    const usingStream = this.exchangeStream.subscribe(symbol, exchange, timeframe, (update) => {
      this.broadcastCandle({
        symbol: update.symbol,
        exchange: update.exchange,
        timeframe: update.timeframe,
        candle: update.candle,
      });
    });

    if (usingStream) {
      this.streamedChannels.add(key);
      this.logger.debug(`WS stream started for ${key}`);
      return;
    }

    // Fallback: REST polling for unsupported exchanges
    this.startCandlePollingFallback(symbol, exchange, timeframe, key);
  }

  private startCandlePollingFallback(symbol: string, exchange: string, timeframe: string, key: string): void {
    const poll = async () => {
      try {
        const candles = await this.exchangeService.getCandlesLive(exchange, symbol, timeframe, 1);
        if (candles.length > 0) {
          const candle = candles[0];
          const state = this.candlePolls.get(key);
          if (state) {
            const changed = candle.timestamp !== state.lastTimestamp
              || candle.open !== state.lastCandle?.open
              || candle.high !== state.lastCandle?.high
              || candle.low !== state.lastCandle?.low
              || candle.close !== state.lastCandle?.close
              || candle.volume !== state.lastCandle?.volume;
            if (!changed) return;
            state.lastTimestamp = candle.timestamp;
            state.lastCandle = candle;
          }
          this.broadcastCandle({
            symbol,
            exchange: exchange as any,
            timeframe: timeframe as any,
            candle,
          });
        }
      } catch (err) {
        this.logger.debug(`Candle poll error for ${key}: ${err}`);
      }
    };

    const timer = setInterval(poll, 500);
    this.candlePolls.set(key, { symbol, exchange, timeframe, timer, lastTimestamp: 0 });
    poll();
    this.logger.debug(`REST polling started for ${key}`);
  }

  private stopCandleStream(symbol: string, exchange: string, timeframe: string): void {
    const key = `${symbol}:${exchange}:${timeframe}`;

    if (this.streamedChannels.has(key)) {
      this.exchangeStream.unsubscribe(symbol, exchange, timeframe);
      this.streamedChannels.delete(key);
      this.logger.debug(`WS stream stopped for ${key}`);
      return;
    }

    const state = this.candlePolls.get(key);
    if (state) {
      clearInterval(state.timer);
      this.candlePolls.delete(key);
    }
  }

  onModuleDestroy(): void {
    for (const [, state] of this.candlePolls) {
      clearInterval(state.timer);
    }
    this.candlePolls.clear();
    this.streamedChannels.clear();
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    const ip = client.handshake.address || 'unknown';
    const currentCount = this.connectionCounts.get(ip) || 0;

    if (currentCount >= this.MAX_CONNECTIONS_PER_IP) {
      this.logger.warn(`Rate limited IP ${ip} (${currentCount} connections)`);
      client.emit('error', { message: 'Too many connections' });
      client.disconnect(true);
      return;
    }

    this.connectionCounts.set(ip, currentCount + 1);

    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token) {
        const payload = await this.authService.validateToken(token);
        if (payload) {
          (client as any).user = payload;
          this.logger.debug(`Authenticated client connected: ${client.id}`);
        }
      }
    } catch {
      this.logger.debug(`Anonymous client connected: ${client.id}`);
    }

    (client as any).__lastPing = Date.now();
    client.emit('connected', { id: client.id, timestamp: Date.now() });
  }

  handleDisconnect(client: Socket): void {
    const ip = client.handshake.address || 'unknown';
    const currentCount = this.connectionCounts.get(ip) || 0;
    this.connectionCounts.set(ip, Math.max(0, currentCount - 1));

    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    (client as any).__lastPing = Date.now();
    client.emit('pong', { timestamp: Date.now() });
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; symbol?: string; exchange?: string; timeframe?: string },
  ): Promise<void> {
    if (!this.checkRateLimit(client.id)) {
      client.emit('error', { message: 'Rate limit exceeded' });
      return;
    }

    const { channel } = data;
    let roomName = channel;

    // Parse candle channel format: "candle:SYMBOL:EXCHANGE:TF"
    // SYMBOL may contain ':' for futures (e.g. BTCUSDT:USDT), so match greedily up to last two segments
    const candleMatch = channel.match(/^candle:(.+?):([^:]+):([^:]+)$/);
    if (candleMatch) {
      const [, symbol, exchange, timeframe] = candleMatch;
      this.startCandleStream(symbol, exchange, timeframe);
      roomName = `candle:${symbol}:${exchange}:${timeframe}`;
    }

    await client.join(roomName);
    this.logger.debug(`Client ${client.id} subscribed to ${roomName}`);
    client.emit('subscribed', { channel: roomName, timestamp: Date.now() });
  }

  @SubscribeMessage('unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string; symbol?: string; exchange?: string; timeframe?: string },
  ): Promise<void> {
    const { channel } = data;
    let roomName = channel;

    const candleMatch = channel.match(/^candle:(.+?):([^:]+):([^:]+)$/);
    if (candleMatch) {
      const [, symbol, exchange, timeframe] = candleMatch;
      roomName = `candle:${symbol}:${exchange}:${timeframe}`;
      try {
        const room = this.server?.sockets?.adapter?.rooms?.get(roomName);
        if (!room || room.size <= 1) {
          this.stopCandleStream(symbol, exchange, timeframe);
        }
      } catch {
        this.stopCandleStream(symbol, exchange, timeframe);
      }
    }

    await client.leave(roomName);
    this.logger.debug(`Client ${client.id} unsubscribed from ${roomName}`);
    client.emit('unsubscribed', { channel: roomName, timestamp: Date.now() });
  }

  broadcastTicker(ticker: WSTickerUpdate): void {
    const event: WSEvent<WSTickerUpdate> = {
      event: 'ticker',
      data: ticker,
      timestamp: Date.now(),
    };

    this.server.to('ticker').emit('ticker', event);

    const symbolRoom = `ticker:${ticker.symbol}`;
    this.server.to(symbolRoom).emit('ticker', event);
  }

  broadcastCandle(update: WSCandleUpdate): void {
    const event: WSEvent<WSCandleUpdate> = {
      event: 'candle',
      data: update,
      timestamp: Date.now(),
    };

    const room = `candle:${update.symbol}:${update.exchange}:${update.timeframe}`;
    this.server.to(room).emit('candle', event);
  }

  broadcastOrderBook(update: WSOrderBookUpdate): void {
    const event: WSEvent<WSOrderBookUpdate> = {
      event: 'orderbook',
      data: update,
      timestamp: Date.now(),
    };

    const room = `orderbook:${update.symbol}:${update.exchange}`;
    this.server.to(room).emit('orderbook', event);
  }

  broadcastTrade(update: WSTradeUpdate): void {
    const event: WSEvent<WSTradeUpdate> = {
      event: 'trades',
      data: update,
      timestamp: Date.now(),
    };

    const room = `trades:${update.symbol}:${update.exchange}`;
    this.server.to(room).emit('trades', event);
  }

  broadcastAlert(alert: WSAlert): void {
    const event: WSEvent<WSAlert> = {
      event: 'alert',
      data: alert,
      timestamp: Date.now(),
    };

    this.server.emit('alert', event);

    if (alert.alert.id) {
      const room = `alerts:${alert.alert.id}`;
      this.server.to(room).emit('alert', event);
    }
  }

  broadcastToAll(event: string, data: any): void {
    this.server.emit(event, { event, data, timestamp: Date.now() });
  }

  private getRoomName(channel: string, symbol?: string, exchange?: string): string {
    const parts = [channel];
    if (symbol) parts.push(symbol);
    if (exchange) parts.push(exchange);
    return parts.join(':');
  }

  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    let state = this.rateLimits.get(clientId);

    if (!state || now - state.windowStart > this.RATE_LIMIT_WINDOW) {
      state = { count: 0, windowStart: now };
      this.rateLimits.set(clientId, state);
    }

    state.count++;
    return state.count <= this.RATE_LIMIT_MAX;
  }
}
