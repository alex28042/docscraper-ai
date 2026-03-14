import { describe, it, expect, vi } from 'vitest';
import { Crawler } from '../../src/crawling/crawler';
import type { IHttpClient } from '../../src/interfaces/http-client';
import type { ICrawlProgress, CrawlProgressEvent } from '../../src/interfaces/progress';
import type { CrawlStats } from '../../src/types';
import { SemaphoreConcurrencyLimiter } from '../../src/http/concurrency-limiter';
import { CheerioHtmlParser } from '../../src/parsing/parser';
import { TurndownConverter } from '../../src/parsing/converter';
import { CheerioLinkExtractor } from '../../src/parsing/link-extractor';
import { NullLogger } from '../../src/interfaces/logger';

const BASE = 'https://example.com';

function makeHtml(title: string, content: string, links: string[] = []): string {
  const linkTags = links.map((l) => `<a href="${l}">${l}</a>`).join('');
  return `<html><head><title>${title}</title></head><body><main><p>${content}</p>${linkTags}</main></body></html>`;
}

function createMockHttpClient(pages: Record<string, string>): IHttpClient {
  return {
    async fetch(url: string): Promise<string> {
      const html = pages[url];
      if (!html) throw new Error(`Not found: ${url}`);
      return html;
    },
  };
}

function createMockProgress(): ICrawlProgress & {
  pageEvents: CrawlProgressEvent[];
  completeStats: CrawlStats | undefined;
} {
  const pageEvents: CrawlProgressEvent[] = [];
  let completeStats: CrawlStats | undefined;

  return {
    pageEvents,
    get completeStats() {
      return completeStats;
    },
    onPageComplete: vi.fn((event: CrawlProgressEvent) => {
      pageEvents.push(event);
    }),
    onCrawlComplete: vi.fn((stats: CrawlStats) => {
      completeStats = stats;
    }),
  };
}

function createCrawlerWithProgress(
  pages: Record<string, string>,
  progress: ICrawlProgress,
): Crawler {
  return new Crawler(
    createMockHttpClient(pages),
    new SemaphoreConcurrencyLimiter(2),
    new CheerioHtmlParser(),
    new TurndownConverter(),
    new CheerioLinkExtractor(),
    new NullLogger(),
    progress,
  );
}

describe('ICrawlProgress integration', () => {
  it('should call onPageComplete for each successfully crawled page', async () => {
    const progress = createMockProgress();
    const crawler = createCrawlerWithProgress(
      {
        [`${BASE}/`]: makeHtml('Home', 'Home page', [`${BASE}/a`]),
        [`${BASE}/a`]: makeHtml('Page A', 'Content A'),
      },
      progress,
    );

    await crawler.crawl(`${BASE}/`, { maxDepth: 1 });

    expect(progress.onPageComplete).toHaveBeenCalledTimes(2);
    expect(progress.pageEvents[0].status).toBe('success');
    expect(progress.pageEvents[0].url).toBe(`${BASE}/`);
    expect(progress.pageEvents[1].status).toBe('success');
    expect(progress.pageEvents[1].url).toBe(`${BASE}/a`);
  });

  it('should call onPageComplete with error status for failed pages', async () => {
    const progress = createMockProgress();
    const crawler = createCrawlerWithProgress(
      {
        [`${BASE}/`]: makeHtml('Home', 'Home page', [`${BASE}/broken`]),
      },
      progress,
    );

    await crawler.crawl(`${BASE}/`, { maxDepth: 1 });

    expect(progress.onPageComplete).toHaveBeenCalledTimes(2);

    const successEvent = progress.pageEvents.find((e) => e.status === 'success');
    const errorEvent = progress.pageEvents.find((e) => e.status === 'error');

    expect(successEvent).toBeDefined();
    expect(successEvent!.url).toBe(`${BASE}/`);

    expect(errorEvent).toBeDefined();
    expect(errorEvent!.url).toBe(`${BASE}/broken`);
    expect(errorEvent!.error).toBeDefined();
  });

  it('should call onCrawlComplete with stats at the end', async () => {
    const progress = createMockProgress();
    const crawler = createCrawlerWithProgress(
      {
        [`${BASE}/`]: makeHtml('Home', 'Home page'),
      },
      progress,
    );

    await crawler.crawl(`${BASE}/`);

    expect(progress.onCrawlComplete).toHaveBeenCalledTimes(1);
    expect(progress.completeStats).toBeDefined();
    expect(progress.completeStats!.totalPages).toBe(1);
    expect(progress.completeStats!.totalErrors).toBe(0);
    expect(progress.completeStats!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should include currentPage and totalPages in progress events', async () => {
    const progress = createMockProgress();
    const crawler = createCrawlerWithProgress(
      {
        [`${BASE}/`]: makeHtml('Home', 'Home page', [`${BASE}/a`, `${BASE}/b`]),
        [`${BASE}/a`]: makeHtml('A', 'Content A'),
        [`${BASE}/b`]: makeHtml('B', 'Content B'),
      },
      progress,
    );

    await crawler.crawl(`${BASE}/`, { maxDepth: 1, maxPages: 10 });

    expect(progress.pageEvents.length).toBe(3);
    for (const event of progress.pageEvents) {
      expect(event.totalPages).toBe(10);
      expect(event.currentPage).toBeGreaterThan(0);
    }
  });

  it('should work without progress (default NullProgress)', async () => {
    const crawler = new Crawler(
      createMockHttpClient({
        [`${BASE}/`]: makeHtml('Home', 'Home page'),
      }),
      new SemaphoreConcurrencyLimiter(2),
      new CheerioHtmlParser(),
      new TurndownConverter(),
      new CheerioLinkExtractor(),
      new NullLogger(),
    );

    // Should not throw
    const result = await crawler.crawl(`${BASE}/`);
    expect(result.pages.length).toBe(1);
  });
});
