import { describe, it, expect, beforeAll } from 'vitest';
import { HttpClientFactory } from '../../src/factories/http-client-factory';
import { CrawlerFactory } from '../../src/factories/crawler-factory';
import { DiscovererFactory } from '../../src/factories/discoverer-factory';
import { TokenBucketRateLimiter } from '../../src/http/rate-limiter';
import { InMemoryCache } from '../../src/http/in-memory-cache';
import { toRequestsPerSecond, toConcurrencyLevel, toMilliseconds } from '../../src/types';
import type { HttpClientType } from '../../src/factories/http-client-factory';

beforeAll(() => {
  process.emitWarning = () => {};
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
});

const TEST_URL = 'https://example.com';

describe('HttpClientFactory (real)', { timeout: 30_000 }, () => {
  const types: HttpClientType[] = ['fetch', 'axios', 'undici'];

  it.each(types)('creates a working %s client', async (type) => {
    const factory = new HttpClientFactory(type, { timeoutMs: 10_000 });
    const client = await factory.create(new TokenBucketRateLimiter(10));

    const html = await client.fetch(TEST_URL);
    expect(html).toContain('Example Domain');
  });
});

describe('CrawlerFactory (real)', { timeout: 60_000 }, () => {
  const types: HttpClientType[] = ['fetch', 'axios', 'undici'];

  it.each(types)('creates a crawler with %s that scrapes real pages', async (type) => {
    const factory = new CrawlerFactory({
      rateLimit: toRequestsPerSecond(3),
      concurrency: toConcurrencyLevel(2),
      timeoutMs: toMilliseconds(10_000),
      httpClient: type,
    });

    const crawler = await factory.create();
    const page = await crawler.scrapePage(TEST_URL);

    expect(page.markdown).toContain('Example Domain');
  });

  it('creates a crawler with retry that works', async () => {
    const factory = new CrawlerFactory({
      rateLimit: toRequestsPerSecond(3),
      timeoutMs: toMilliseconds(10_000),
      retry: { maxRetries: 2, baseDelayMs: 500 },
    });

    const crawler = await factory.create();
    const page = await crawler.scrapePage(TEST_URL);

    expect(page.markdown).toContain('Example Domain');
  });

  it('creates a crawler with cache that deduplicates requests', async () => {
    const cache = new InMemoryCache({ maxEntries: 10, ttlMs: 60_000 });
    const factory = new CrawlerFactory({
      rateLimit: toRequestsPerSecond(3),
      timeoutMs: toMilliseconds(10_000),
      cache,
    });

    const crawler = await factory.create();
    const first = await crawler.scrapePage(TEST_URL);
    const second = await crawler.scrapePage(TEST_URL);

    expect(first.markdown).toBe(second.markdown);
  });

  it('creates a crawler with retry + cache combined', async () => {
    const cache = new InMemoryCache({ maxEntries: 10, ttlMs: 60_000 });
    const factory = new CrawlerFactory({
      rateLimit: toRequestsPerSecond(3),
      timeoutMs: toMilliseconds(10_000),
      retry: true,
      cache,
    });

    const crawler = await factory.create();
    const page = await crawler.scrapePage(TEST_URL);

    expect(page.markdown).toContain('Example Domain');
  });
});

describe('DiscovererFactory (real)', { timeout: 60_000 }, () => {
  it('creates a discoverer that finds real documentation', async () => {
    const factory = new DiscovererFactory('fetch');
    const discoverer = await factory.create();

    const results = await discoverer.discover('react', 3);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('url');
    expect(results[0]).toHaveProperty('title');
    expect(results[0].url).toMatch(/^https?:\/\//);
  });
});
