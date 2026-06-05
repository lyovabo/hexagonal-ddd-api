import Redis from 'ioredis';
import { CachePort } from '../../../application/ports/out/CachePort';
import { config } from '../../../config';

export class RedisCache implements CachePort {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const ttl = ttlSeconds ?? config.redis.ttl;
    await this.client.setex(key, ttl, serialized);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  getClient(): Redis {
    return this.client;
  }
}

// Singleton
let redisInstance: RedisCache | null = null;

export function getRedisCache(): RedisCache {
  if (!redisInstance) {
    redisInstance = new RedisCache();
  }
  return redisInstance;
}
