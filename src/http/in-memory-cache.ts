import type { ICache, CacheEntry } from '../interfaces/cache';

export interface InMemoryCacheOptions {
  /** Time-to-live in milliseconds. 0 = no expiry. Default: 300_000 (5 min) */
  ttlMs?: number;
  /** Max entries. 0 = unlimited. Default: 1000 */
  maxEntries?: number;
}

export class InMemoryCache implements ICache {
  private readonly store = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: InMemoryCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 300_000;
    this.maxEntries = options.maxEntries ?? 1000;
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }

  set(key: string, data: string): void {
    if (this.maxEntries > 0 && this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }

    this.store.set(key, { data, cachedAt: Date.now() });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private isExpired(entry: CacheEntry): boolean {
    if (this.ttlMs <= 0) return false;
    return Date.now() - entry.cachedAt > this.ttlMs;
  }
}
