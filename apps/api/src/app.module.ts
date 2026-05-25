import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { ExchangeModule } from './exchange/exchange.module';
import { MarketDataModule } from './market-data/market-data.module';
import { WebSocketModule } from './websocket/websocket.module';
import { ScreenerModule } from './screener/screener.module';
import { AlertsModule } from './alerts/alerts.module';
import { PatternsModule } from './patterns/patterns.module';
import { HeatmapModule } from './heatmap/heatmap.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { CandleModule } from './candle/candle.module';
import { HealthModule } from './health/health.module';

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
    };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const opts = parseRedisUrl(redisUrl);
        return {
          connection: {
            ...opts,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
        };
      },
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ExchangeModule,
    MarketDataModule,
    WebSocketModule,
    ScreenerModule,
    AlertsModule,
    PatternsModule,
    HeatmapModule,
    WatchlistModule,
    CandleModule,
    HealthModule,
  ],
})
export class AppModule {}
