import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InMemoryCache } from '../../../src/http/in-memory-cache';

describe('InMemoryCache', () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache({ ttlMs: 60_000 });
  });

  it('should store and retrieve values', () => {
    cache.set('key', 'value');
    expect(cache.get('key')).toBe('value');
  });

  it('should return undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('should delete entries', () => {
    cache.set('key', 'value');
    cache.delete('key');
    expect(cache.get('key')).toBeUndefined();
  });

  it('should clear all entries', () => {
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('should expire entries after TTL', () => {
    const shortCache = new InMemoryCache({ ttlMs: 50 });
    shortCache.set('key', 'value');

    vi.useFakeTimers();
    vi.advanceTimersByTime(100);

    expect(shortCache.get('key')).toBeUndefined();

    vi.useRealTimers();
  });

  it('should not expire when TTL is 0', () => {
    const noExpiry = new InMemoryCache({ ttlMs: 0 });
    noExpiry.set('key', 'value');

    vi.useFakeTimers();
    vi.advanceTimersByTime(999_999);

    expect(noExpiry.get('key')).toBe('value');

    vi.useRealTimers();
  });

  it('should evict oldest entry when maxEntries exceeded', () => {
    const small = new InMemoryCache({ maxEntries: 2, ttlMs: 0 });
    small.set('a', '1');
    small.set('b', '2');
    small.set('c', '3');

    expect(small.get('a')).toBeUndefined();
    expect(small.get('b')).toBe('2');
    expect(small.get('c')).toBe('3');
  });

  it('should not evict when updating existing key', () => {
    const small = new InMemoryCache({ maxEntries: 2, ttlMs: 0 });
    small.set('a', '1');
    small.set('b', '2');
    small.set('a', 'updated');

    expect(small.get('a')).toBe('updated');
    expect(small.get('b')).toBe('2');
  });
});
