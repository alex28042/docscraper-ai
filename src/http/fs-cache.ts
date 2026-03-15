import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ICache, CacheEntry } from '../interfaces/cache';

export interface FsCacheOptions {
  /** Directory to store cache files. Default: .docscraper-cache */
  cacheDir?: string;
  /** Time-to-live in milliseconds. 0 = no expiry. Default: 3_600_000 (1 hour) */
  ttlMs?: number;
}

export class FsCache implements ICache {
  private readonly cacheDir: string;
  private readonly ttlMs: number;

  constructor(options: FsCacheOptions = {}) {
    this.cacheDir = options.cacheDir ?? '.docscraper-cache';
    this.ttlMs = options.ttlMs ?? 3_600_000;
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }

  get(key: string): CacheEntry | undefined {
    const filePath = this.keyToPath(key);

    if (!fs.existsSync(filePath)) return undefined;

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const entry: CacheEntry = JSON.parse(raw);

      if (this.isExpired(entry)) {
        fs.unlinkSync(filePath);
        return undefined;
      }

      return entry;
    } catch {
      return undefined;
    }
  }

  set(key: string, data: string): void {
    const filePath = this.keyToPath(key);
    const entry: CacheEntry = { data, cachedAt: Date.now() };
    fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    const filePath = this.keyToPath(key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  clear(): void {
    if (fs.existsSync(this.cacheDir)) {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    }
  }

  size(): number {
    if (!fs.existsSync(this.cacheDir)) return 0;
    return fs.readdirSync(this.cacheDir).length;
  }

  private keyToPath(key: string): string {
    const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
    return path.join(this.cacheDir, `${hash}.json`);
  }

  private isExpired(entry: CacheEntry): boolean {
    if (this.ttlMs <= 0) return false;
    return Date.now() - entry.cachedAt > this.ttlMs;
  }
}
