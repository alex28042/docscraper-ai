import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryCache } from '../../../src/http/in-memory-cache';

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache({ ttlMs: 60_000 });
  });

  it('should store and retrieve values', () => {
    cache.set('key', 'value');
    const entry = cache.get('key');
    expect(entry).toBeDefined();
    expect(entry!.data).toBe('value');
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should report has() correctly', () => {
    expect(cache.has('key')).toBe(false);
    cache.set('key', 'value');
    expect(cache.has('key')).toBe(true);
  });

  it('should delete entries', () => {
    cache.set('key', 'value');
    cache.delete('key');
    expect(cache.has('key')).toBe(false);
  });

  it('should clear all entries', () => {
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should expire entries after TTL', () => {
    const shortCache = new InMemoryCache({ ttlMs: 50 });
    shortCache.set('key', 'value');

    vi.useFakeTimers();
    vi.advanceTimersByTime(100);

    expect(shortCache.get('key')).toBeUndefined();
    expect(shortCache.has('key')).toBe(false);

    vi.useRealTimers();
  });

  it('should not expire when TTL is 0', () => {
    const noExpiry = new InMemoryCache({ ttlMs: 0 });
    noExpiry.set('key', 'value');

    vi.useFakeTimers();
    vi.advanceTimersByTime(999_999);

    expect(noExpiry.get('key')).toBeDefined();

    vi.useRealTimers();
  });

  it('should evict oldest entry when maxEntries exceeded', () => {
    const small = new InMemoryCache({ maxEntries: 2, ttlMs: 0 });
    small.set('a', '1');
    small.set('b', '2');
    small.set('c', '3');

    expect(small.has('a')).toBe(false);
    expect(small.has('b')).toBe(true);
    expect(small.has('c')).toBe(true);
    expect(small.size()).toBe(2);
  });

  it('should not evict when updating existing key', () => {
    const small = new InMemoryCache({ maxEntries: 2, ttlMs: 0 });
    small.set('a', '1');
    small.set('b', '2');
    small.set('a', 'updated');

    expect(small.has('a')).toBe(true);
    expect(small.has('b')).toBe(true);
    expect(small.get('a')!.data).toBe('updated');
  });

  it('should track size correctly', () => {
    expect(cache.size()).toBe(0);
    cache.set('a', '1');
    expect(cache.size()).toBe(1);
    cache.set('b', '2');
    expect(cache.size()).toBe(2);
    cache.delete('a');
    expect(cache.size()).toBe(1);
  });
});
