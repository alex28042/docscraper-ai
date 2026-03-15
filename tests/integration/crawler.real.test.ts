import { describe, it, expect, beforeAll } from 'vitest';
import { CrawlerFactory } from '../../src/factories/crawler-factory';
import { StderrLogger } from '../../src/interfaces/logger';
import { toRequestsPerSecond, toConcurrencyLevel, toMilliseconds } from '../../src/types';

beforeAll(() => {
  process.emitWarning = () => {};
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
});

function createFactory() {
  return new CrawlerFactory({
    rateLimit: toRequestsPerSecond(3),
    concurrency: toConcurrencyLevel(2),
    timeoutMs: toMilliseconds(10_000),
  });
}

describe('Crawler (real)', { timeout: 30_000 }, () => {
  it('scrapes a single page and returns structured content', async () => {
    const crawler = await createFactory().create();
    const page = await crawler.scrapePage('https://example.com');

    expect(page.url).toBe('https://example.com');
    expect(page.title).toBeTruthy();
    expect(page.markdown).toContain('Example Domain');
    expect(page.markdown.length).toBeGreaterThan(10);
  });

  it('produces clean markdown without HTML tags', async () => {
    const crawler = await createFactory().create();
    const page = await crawler.scrapePage('https://example.com');

    expect(page.markdown).not.toContain('<script');
    expect(page.markdown).not.toContain('<style');
    expect(page.markdown).not.toContain('<nav');
    expect(page.markdown).not.toContain('<footer');
  });

  it('crawls with depth 0 returning only the start page', async () => {
    const crawler = await createFactory().create();
    const result = await crawler.crawl('https://example.com', {
      maxDepth: 0,
      maxPages: 1,
    });

    expect(result.pages.length).toBe(1);
    expect(result.pages[0].markdown).toContain('Example Domain');
    expect(result.stats.totalPages).toBe(1);
    expect(result.stats.totalErrors).toBe(0);
  });

  it('collects errors for unreachable domains without crashing', async () => {
    const crawler = await createFactory().create();
    const result = await crawler.crawl('https://thisdomaindoesnotexist99999.com', {
      maxDepth: 0,
      maxPages: 1,
    });

    expect(result.pages).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('respects maxPages limit', async () => {
    const crawler = await createFactory().create();
    const result = await crawler.crawl('https://example.com', {
      maxDepth: 2,
      maxPages: 3,
    });

    expect(result.pages.length).toBeLessThanOrEqual(3);
  });

  it('populates stats with valid timestamps and duration', async () => {
    const crawler = await createFactory().create();
    const result = await crawler.crawl('https://example.com', {
      maxDepth: 0,
      maxPages: 1,
    });

    expect(result.stats.startedAt).toBeInstanceOf(Date);
    expect(result.stats.completedAt).toBeInstanceOf(Date);
    expect(result.stats.completedAt.getTime()).toBeGreaterThanOrEqual(
      result.stats.startedAt.getTime(),
    );
    expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('works with a custom logger', async () => {
    const factory = new CrawlerFactory(
      {
        rateLimit: toRequestsPerSecond(3),
        timeoutMs: toMilliseconds(10_000),
      },
      new StderrLogger(),
    );

    const crawler = await factory.create();
    const page = await crawler.scrapePage('https://example.com');

    expect(page.title).toBeTruthy();
  });
});
