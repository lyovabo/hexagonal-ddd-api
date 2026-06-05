export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  invalidatePattern(pattern: string): Promise<void>;
}

export const CACHE_PORT = Symbol('CachePort');
