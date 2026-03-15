import { describe, it, expect, beforeAll } from 'vitest';
import { TokenBucketRateLimiter } from '../../src/http/rate-limiter';
import { FetchHttpClient } from '../../src/http/fetch-http-client';
import { AxiosHttpClient } from '../../src/http/axios-http-client';
import { UndiciHttpClient } from '../../src/http/undici-http-client';
import { RetryHttpClient } from '../../src/http/retry-http-client';
import { CachedHttpClient } from '../../src/http/cached-http-client';
import { InMemoryCache } from '../../src/http/in-memory-cache';
import type { IHttpClient } from '../../src/interfaces/http-client';

beforeAll(() => {
  process.emitWarning = () => {};
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
});

const TEST_URL = 'https://example.com';

function createRateLimiter() {
  return new TokenBucketRateLimiter(10);
}

const options = { userAgent: 'docscraper-ai/test', timeoutMs: 10_000 };

describe('FetchHttpClient (real)', { timeout: 15_000 }, () => {
  it('fetches HTML from example.com', async () => {
    const client = new FetchHttpClient(createRateLimiter(), options);
    const html = await client.fetch(TEST_URL);

    expect(html).toContain('Example Domain');
    expect(html).toContain('<html');
  });

  it('throws on HTTP 404', async () => {
    const client = new FetchHttpClient(createRateLimiter(), options);
    await expect(
      client.fetch('http://httpbin.org/status/404', { allowAnyContent: true }),
    ).rejects.toThrow(/HTTP 404/);
  });

  it('throws on HTTP 500', async () => {
    const client = new FetchHttpClient(createRateLimiter(), options);
    await expect(
      client.fetch('http://httpbin.org/status/500', { allowAnyContent: true }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it('aborts on timeout', async () => {
    const client = new FetchHttpClient(createRateLimiter(), options);
    await expect(
      client.fetch('http://httpbin.org/delay/15', { timeoutMs: 1000 }),
    ).rejects.toThrow();
  });
});

describe('AxiosHttpClient (real)', { timeout: 15_000 }, () => {
  it('fetches HTML from example.com', async () => {
    const client = new AxiosHttpClient(createRateLimiter(), options);
    const html = await client.fetch(TEST_URL);

    expect(html).toContain('Example Domain');
  });

  it('throws on HTTP 404', async () => {
    const client = new AxiosHttpClient(createRateLimiter(), options);
    await expect(client.fetch('http://httpbin.org/status/404')).rejects.toThrow();
  });

  it('throws on HTTP 500', async () => {
    const client = new AxiosHttpClient(createRateLimiter(), options);
    await expect(client.fetch('http://httpbin.org/status/500')).rejects.toThrow();
  });
});

describe('UndiciHttpClient (real)', { timeout: 15_000 }, () => {
  it('fetches HTML from example.com', async () => {
    const client = new UndiciHttpClient(createRateLimiter(), options);
    const html = await client.fetch(TEST_URL);

    expect(html).toContain('Example Domain');
  });

  it('throws on HTTP 404', async () => {
    const client = new UndiciHttpClient(createRateLimiter(), options);
    await expect(client.fetch('http://httpbin.org/status/404')).rejects.toThrow();
  });

  it('throws on HTTP 500', async () => {
    const client = new UndiciHttpClient(createRateLimiter(), options);
    await expect(client.fetch('http://httpbin.org/status/500')).rejects.toThrow();
  });
});

describe('RetryHttpClient (real)', { timeout: 30_000 }, () => {
  it('succeeds without retries for valid URL', async () => {
    const base = new FetchHttpClient(createRateLimiter(), options);
    const client = new RetryHttpClient(base, { maxRetries: 2, baseDelayMs: 500 });

    const html = await client.fetch(TEST_URL);
    expect(html).toContain('Example Domain');
  });

  it('exhausts retries on persistent 500', async () => {
    const base = new FetchHttpClient(createRateLimiter(), options);
    const client = new RetryHttpClient(base, { maxRetries: 1, baseDelayMs: 200 });

    await expect(client.fetch('http://httpbin.org/status/500')).rejects.toThrow();
  });

  it('does not retry 404 client errors', async () => {
    let fetchCount = 0;
    const base = new FetchHttpClient(createRateLimiter(), options);
    const counting: IHttpClient = {
      async fetch(url, opts) {
        fetchCount++;
        return base.fetch(url, { ...opts, allowAnyContent: true });
      },
    };

    const client = new RetryHttpClient(counting, { maxRetries: 3, baseDelayMs: 100 });

    await expect(
      client.fetch('http://httpbin.org/status/404', { allowAnyContent: true }),
    ).rejects.toThrow(/HTTP 404/);
    expect(fetchCount).toBe(1);
  });
});

describe('CachedHttpClient (real)', { timeout: 15_000 }, () => {
  it('returns cached response on second fetch', async () => {
    let fetchCount = 0;
    const base = new FetchHttpClient(createRateLimiter(), options);
    const counting: IHttpClient = {
      async fetch(url, opts) {
        fetchCount++;
        return base.fetch(url, opts);
      },
    };

    const cache = new InMemoryCache({ maxEntries: 10, ttlMs: 60_000 });
    const client = new CachedHttpClient(counting, cache);

    const first = await client.fetch(TEST_URL);
    const second = await client.fetch(TEST_URL);

    expect(first).toBe(second);
    expect(first).toContain('Example Domain');
    expect(fetchCount).toBe(1);
  });
});
