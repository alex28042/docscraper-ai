import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ICache } from '../interfaces/cache';

export interface FsCacheOptions {
  /** Directory to store cache files. Default: .docscraper-cache */
  cacheDir?: string;
  /** Time-to-live in milliseconds. 0 = no expiry. Default: 3_600_000 (1 hour) */
  ttlMs?: number;
}

interface FsEntry {
  value: string;
  expiresAt: number;
}

export class FsCache implements ICache {
  private readonly cacheDir: string;
  private readonly ttlMs: number;

  constructor(options: FsCacheOptions = {}) {
    this.cacheDir = options.cacheDir ?? '.docscraper-cache';
    this.ttlMs = options.ttlMs ?? 3_600_000;
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }

  get(key: string): string | undefined {
    const filePath = this.keyToPath(key);
    if (!fs.existsSync(filePath)) return undefined;

    try {
      const entry: FsEntry = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (this.ttlMs > 0 && Date.now() > entry.expiresAt) {
        fs.unlinkSync(filePath);
        return undefined;
      }

      return entry.value;
    } catch {
      return undefined;
    }
  }

  set(key: string, value: string): void {
    const entry: FsEntry = {
      value,
      expiresAt: this.ttlMs > 0 ? Date.now() + this.ttlMs : Infinity,
    };
    fs.writeFileSync(this.keyToPath(key), JSON.stringify(entry), 'utf-8');
  }

  delete(key: string): void {
    const filePath = this.keyToPath(key);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  clear(): void {
    if (!fs.existsSync(this.cacheDir)) return;
    for (const file of fs.readdirSync(this.cacheDir)) {
      fs.unlinkSync(path.join(this.cacheDir, file));
    }
  }

  private keyToPath(key: string): string {
    const hash = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
    return path.join(this.cacheDir, `${hash}.json`);
  }
}
