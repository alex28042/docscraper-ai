import { describe, it, expect, vi } from 'vitest';
import { CachedHttpClient } from '../../../src/http/cached-http-client';
import type { IHttpClient } from '../../../src/interfaces/http-client';
import { InMemoryCache } from '../../../src/http/in-memory-cache';

function createMockClient(responses: Record<string, string>): IHttpClient & { callCount: number } {
  const mock = {
    callCount: 0,
    async fetch(url: string): Promise<string> {
      mock.callCount++;
      const html = responses[url];
      if (!html) throw new Error(`Not found: ${url}`);
      return html;
    },
  };
  return mock;
}

describe('CachedHttpClient', () => {
  it('should return cached response on second call', async () => {
    const inner = createMockClient({ 'https://example.com': '<html>Hello</html>' });
    const cache = new InMemoryCache({ ttlMs: 60_000 });
    const client = new CachedHttpClient(inner, cache);

    const first = await client.fetch('https://example.com');
    const second = await client.fetch('https://example.com');

    expect(first).toBe('<html>Hello</html>');
    expect(second).toBe('<html>Hello</html>');
    expect(inner.callCount).toBe(1);
  });

  it('should not cache different URLs together', async () => {
    const inner = createMockClient({
      'https://a.com': 'A',
      'https://b.com': 'B',
    });
    const cache = new InMemoryCache();
    const client = new CachedHttpClient(inner, cache);

    const a = await client.fetch('https://a.com');
    const b = await client.fetch('https://b.com');

    expect(a).toBe('A');
    expect(b).toBe('B');
    expect(inner.callCount).toBe(2);
  });

  it('should re-fetch after cache expires', async () => {
    const inner = createMockClient({ 'https://example.com': 'data' });
    const cache = new InMemoryCache({ ttlMs: 50 });
    const client = new CachedHttpClient(inner, cache);

    await client.fetch('https://example.com');
    expect(inner.callCount).toBe(1);

    // Wait for TTL to expire
    await new Promise((r) => setTimeout(r, 80));

    await client.fetch('https://example.com');
    expect(inner.callCount).toBe(2);
  });

  it('should propagate errors without caching them', async () => {
    const inner = createMockClient({});
    const cache = new InMemoryCache();
    const client = new CachedHttpClient(inner, cache);

    await expect(client.fetch('https://missing.com')).rejects.toThrow('Not found');
    expect(cache.size()).toBe(0);
  });

  it('should pass options through to inner client', async () => {
    const fetchSpy = vi.fn().mockResolvedValue('html');
    const inner: IHttpClient = { fetch: fetchSpy };
    const cache = new InMemoryCache();
    const client = new CachedHttpClient(inner, cache);

    await client.fetch('https://example.com', { allowAnyContent: true, timeoutMs: 5000 });

    expect(fetchSpy).toHaveBeenCalledWith('https://example.com', {
      allowAnyContent: true,
      timeoutMs: 5000,
    });
  });

  it('should work with different cache backends', async () => {
    const inner = createMockClient({ 'https://example.com': 'data' });

    // Custom cache implementation
    const customCache = new Map<string, { data: string; cachedAt: number }>();
    const cache = {
      get: (key: string) => customCache.get(key),
      set: (key: string, data: string) => {
        customCache.set(key, { data, cachedAt: Date.now() });
      },
      has: (key: string) => customCache.has(key),
      delete: (key: string) => {
        customCache.delete(key);
      },
      clear: () => customCache.clear(),
      size: () => customCache.size,
    };

    const client = new CachedHttpClient(inner, cache);
    await client.fetch('https://example.com');
    await client.fetch('https://example.com');

    expect(inner.callCount).toBe(1);
  });
});
