import type { ICache } from '../interfaces/cache';

export interface InMemoryCacheOptions {
  /** Time-to-live in milliseconds. 0 = no expiry. Default: 300_000 (5 min) */
  ttlMs?: number;
  /** Max entries. 0 = unlimited. Default: 1000 */
  maxEntries?: number;
}

interface Entry {
  value: string;
  expiresAt: number;
}

export class InMemoryCache implements ICache {
  private readonly store = new Map<string, Entry>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: InMemoryCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 300_000;
    this.maxEntries = options.maxEntries ?? 1000;
  }

  get(key: string): string | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (this.ttlMs > 0 && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: string): void {
    if (this.maxEntries > 0 && this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: this.ttlMs > 0 ? Date.now() + this.ttlMs : Infinity,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
