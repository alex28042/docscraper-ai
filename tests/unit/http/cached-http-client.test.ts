import { describe, it, expect, vi } from 'vitest';
import { CachedHttpClient } from '../../../src/http/cached-http-client';
import type { IHttpClient } from '../../../src/interfaces/http-client';
import type { ICache } from '../../../src/interfaces/cache';
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
    const client = new CachedHttpClient(inner, new InMemoryCache());

    const first = await client.fetch('https://example.com');
    const second = await client.fetch('https://example.com');

    expect(first).toBe('<html>Hello</html>');
    expect(second).toBe('<html>Hello</html>');
    expect(inner.callCount).toBe(1);
  });

  it('should not cache different URLs together', async () => {
    const inner = createMockClient({ 'https://a.com': 'A', 'https://b.com': 'B' });
    const client = new CachedHttpClient(inner, new InMemoryCache());

    expect(await client.fetch('https://a.com')).toBe('A');
    expect(await client.fetch('https://b.com')).toBe('B');
    expect(inner.callCount).toBe(2);
  });

  it('should re-fetch after cache expires', async () => {
    const inner = createMockClient({ 'https://example.com': 'data' });
    const client = new CachedHttpClient(inner, new InMemoryCache({ ttlMs: 50 }));

    await client.fetch('https://example.com');
    expect(inner.callCount).toBe(1);

    await new Promise((r) => setTimeout(r, 80));

    await client.fetch('https://example.com');
    expect(inner.callCount).toBe(2);
  });

  it('should not cache errors', async () => {
    const inner = createMockClient({});
    const client = new CachedHttpClient(inner, new InMemoryCache());

    await expect(client.fetch('https://missing.com')).rejects.toThrow('Not found');
    // Should not have cached the error
    expect(inner.callCount).toBe(1);
  });

  it('should pass options through to inner client', async () => {
    const fetchSpy = vi.fn().mockResolvedValue('html');
    const inner: IHttpClient = { fetch: fetchSpy };
    const client = new CachedHttpClient(inner, new InMemoryCache());

    await client.fetch('https://example.com', { allowAnyContent: true, timeoutMs: 5000 });

    expect(fetchSpy).toHaveBeenCalledWith('https://example.com', {
      allowAnyContent: true,
      timeoutMs: 5000,
    });
  });

  it('should accept any ICache implementation', async () => {
    const inner = createMockClient({ 'https://example.com': 'data' });

    // Custom cache — just a Map
    const store = new Map<string, string>();
    const customCache: ICache = {
      get: (key: string) => store.get(key),
      set: (key: string, value: string) => {
        store.set(key, value);
      },
      delete: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    };

    const client = new CachedHttpClient(inner, customCache);
    await client.fetch('https://example.com');
    await client.fetch('https://example.com');

    expect(inner.callCount).toBe(1);
  });
});
