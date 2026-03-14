import { describe, it, expect } from 'vitest';
import { Crawler } from '../../src/crawling/crawler';
import type { IHttpClient } from '../../src/interfaces/http-client';
import { SemaphoreConcurrencyLimiter } from '../../src/http/concurrency-limiter';
import { CheerioHtmlParser } from '../../src/parsing/parser';
import { TurndownConverter } from '../../src/parsing/converter';
import { CheerioLinkExtractor } from '../../src/parsing/link-extractor';
import { NullLogger } from '../../src/interfaces/logger';

function createMockHttpClient(pages: Record<string, string>): IHttpClient {
  return {
    async fetch(url: string): Promise<string> {
      const html = pages[url];
      if (!html) throw new Error(`Not found: ${url}`);
      return html;
    },
  };
}

const BASE = 'https://example.com';

function makeHtml(title: string, content: string, links: string[] = []): string {
  const linkTags = links.map((l) => `<a href="${l}">${l}</a>`).join('');
  return `<html><head><title>${title}</title></head><body><main><p>${content}</p>${linkTags}</main></body></html>`;
}

describe('Crawler integration', () => {
  function createCrawler(pages: Record<string, string>): Crawler {
    return new Crawler(
      createMockHttpClient(pages),
      new SemaphoreConcurrencyLimiter(2),
      new CheerioHtmlParser(),
      new TurndownConverter(),
      new CheerioLinkExtractor(),
      new NullLogger(),
    );
  }

  it('should scrape a single page', async () => {
    const crawler = createCrawler({
      [`${BASE}/docs`]: makeHtml('Docs', 'Hello world'),
    });

    const page = await crawler.scrapePage(`${BASE}/docs`);
    expect(page.title).toBe('Docs');
    expect(page.markdown).toContain('Hello world');
    expect(page.url).toBe(`${BASE}/docs`);
  });

  it('should crawl with BFS and respect maxDepth', async () => {
    const crawler = createCrawler({
      [`${BASE}/`]: makeHtml('Home', 'Home page', [`${BASE}/a`]),
      [`${BASE}/a`]: makeHtml('Page A', 'Content A', [`${BASE}/a/b`]),
      [`${BASE}/a/b`]: makeHtml('Page B', 'Content B', [`${BASE}/a/b/c`]),
      [`${BASE}/a/b/c`]: makeHtml('Page C', 'Content C'),
    });

    const result = await crawler.crawl(`${BASE}/`, { maxDepth: 1 });
    expect(result.pages.length).toBeLessThanOrEqual(3);
    // Should not reach depth 3
    const urls = result.pages.map((p) => p.url);
    expect(urls).not.toContain(`${BASE}/a/b/c`);
  });

  it('should respect maxPages limit', async () => {
    const crawler = createCrawler({
      [`${BASE}/`]: makeHtml('Home', 'Home', [`${BASE}/a`, `${BASE}/b`, `${BASE}/c`]),
      [`${BASE}/a`]: makeHtml('A', 'A'),
      [`${BASE}/b`]: makeHtml('B', 'B'),
      [`${BASE}/c`]: makeHtml('C', 'C'),
    });

    const result = await crawler.crawl(`${BASE}/`, { maxPages: 2, maxDepth: 1 });
    expect(result.pages.length).toBeLessThanOrEqual(2);
  });

  it('should collect errors for failed fetches', async () => {
    const crawler = createCrawler({
      [`${BASE}/`]: makeHtml('Home', 'Home', [`${BASE}/broken`]),
    });

    const result = await crawler.crawl(`${BASE}/`, { maxDepth: 1 });
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors[0].url).toBe(`${BASE}/broken`);
  });

  it('should not visit the same URL twice', async () => {
    let fetchCount = 0;
    const mockClient: IHttpClient = {
      async fetch(url: string): Promise<string> {
        fetchCount++;
        if (url === `${BASE}/`) return makeHtml('Home', 'Home', [`${BASE}/a`, `${BASE}/a`]);
        if (url === `${BASE}/a`) return makeHtml('A', 'A', [`${BASE}/`]);
        throw new Error('Not found');
      },
    };

    const crawler = new Crawler(
      mockClient,
      new SemaphoreConcurrencyLimiter(2),
      new CheerioHtmlParser(),
      new TurndownConverter(),
      new CheerioLinkExtractor(),
      new NullLogger(),
    );

    await crawler.crawl(`${BASE}/`, { maxDepth: 2 });
    // Home + A = 2 fetches (no revisits)
    expect(fetchCount).toBe(2);
  });

  it('should include stats in result', async () => {
    const crawler = createCrawler({
      [`${BASE}/`]: makeHtml('Home', 'Home'),
    });

    const result = await crawler.crawl(`${BASE}/`);
    expect(result.stats.totalPages).toBe(1);
    expect(result.stats.totalErrors).toBe(0);
    expect(result.stats.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.stats.startedAt).toBeInstanceOf(Date);
    expect(result.stats.completedAt).toBeInstanceOf(Date);
  });
});
