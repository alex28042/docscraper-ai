export interface CacheEntry {
  data: string;
  cachedAt: number;
}

export interface ICache {
  get(key: string): CacheEntry | undefined;
  set(key: string, data: string): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  size(): number;
}
