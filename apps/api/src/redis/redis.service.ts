import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private subscriptions = new Map<string, Set<(message: string) => void>>();

  async onModuleInit(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const baseOptions = {
      retryStrategy(times: number): number {
        if (times > 10) return -1;
        return Math.min(times * 200, 5000);
      },
      maxRetriesPerRequest: 3,
    };

    this.client = new Redis(redisUrl, { ...baseOptions, lazyConnect: true });
    this.subscriber = new Redis(redisUrl, { ...baseOptions, lazyConnect: true });
    this.publisher = new Redis(redisUrl, { ...baseOptions, lazyConnect: true });

    let redisErrorLogged = false;
    const logRedisError = (label: string, err: Error) => {
      if (!redisErrorLogged) {
        this.logger.warn(`Redis connection failed — caching unavailable (${label}: ${err.message})`);
        redisErrorLogged = true;
      }
    };
    this.client.on('error', (err) => logRedisError('client', err));
    this.subscriber.on('error', (err) => logRedisError('subscriber', err));
    this.publisher.on('error', (err) => logRedisError('publisher', err));

    this.client.on('connect', () => this.logger.log('Redis client connected'));
    this.publisher.on('connect', () => this.logger.log('Redis publisher connected'));
    this.subscriber.on('connect', () => this.logger.log('Redis subscriber connected'));

    try {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect(),
      ]);
    } catch (err) {
      this.logger.warn('Redis connection failed — caching will be unavailable');
    }

    this.subscriber.on('message', (channel: string, message: string) => {
      const handlers = this.subscriptions.get(channel);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(message);
          } catch (err) {
            this.logger.error(`Error in subscription handler for ${channel}:`, err);
          }
        }
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.client.quit(),
      this.subscriber.quit(),
      this.publisher.quit(),
    ]);
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Failed to set key ${key}:`, err);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`Failed to delete key ${key}:`, err);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete pattern ${pattern}:`, err);
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch {
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch {
      // ignore
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch {
      return -1;
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.publisher.publish(channel, message);
    } catch (err) {
      this.logger.warn(`Failed to publish to ${channel}:`, err);
    }
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      await this.subscriber.subscribe(channel);
    }
    this.subscriptions.get(channel)!.add(handler);
  }

  async unsubscribe(channel: string, handler?: (message: string) => void): Promise<void> {
    const handlers = this.subscriptions.get(channel);
    if (!handlers) return;
    if (handler) {
      handlers.delete(handler);
    }
    if (!handler || handlers.size === 0) {
      this.subscriptions.delete(channel);
      await this.subscriber.unsubscribe(channel);
    }
  }
}
