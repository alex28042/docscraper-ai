import { describe, it, expect, vi } from 'vitest';
import type { IHttpClient } from '../../../src/interfaces/http-client';
import { RobotsParser } from '../../../src/discovery/robots-parser';

function createMockHttpClient(responses: Record<string, string>): IHttpClient {
  return {
    fetch: vi.fn(async (url: string) => {
      const response = responses[url];
      if (response === undefined) {
        throw new Error(`Not found: ${url}`);
      }
      return response;
    }),
  };
}

const BASIC_ROBOTS = `User-agent: *
Disallow: /private/
Disallow: /admin/
Allow: /public/
Crawl-delay: 2

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap2.xml`;

const BOT_SPECIFIC_ROBOTS = `User-agent: *
Disallow: /

User-agent: docscraper
Disallow: /secret/
Allow: /docs/
Crawl-delay: 5`;

const WILDCARD_ONLY_ROBOTS = `User-agent: *
Disallow: /private/
Crawl-delay: 3`;

describe('RobotsParser', () => {
  it('should allow URLs not covered by Disallow rules', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BASIC_ROBOTS,
    });
    const parser = new RobotsParser(client);

    expect(await parser.isAllowed('https://example.com/page')).toBe(true);
  });

  it('should disallow URLs matching Disallow rules', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BASIC_ROBOTS,
    });
    const parser = new RobotsParser(client);

    expect(await parser.isAllowed('https://example.com/private/data')).toBe(false);
    expect(await parser.isAllowed('https://example.com/admin/panel')).toBe(false);
  });

  it('should allow URLs matching Allow rules', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BASIC_ROBOTS,
    });
    const parser = new RobotsParser(client);

    expect(await parser.isAllowed('https://example.com/public/info')).toBe(true);
  });

  it('should prefer bot-specific rules over wildcard', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BOT_SPECIFIC_ROBOTS,
    });
    const parser = new RobotsParser(client);

    // The wildcard disallows /, but docscraper-specific rules take precedence
    expect(await parser.isAllowed('https://example.com/docs/intro')).toBe(true);
    expect(await parser.isAllowed('https://example.com/secret/file')).toBe(false);
    // Not covered by docscraper-specific disallow — should be allowed
    expect(await parser.isAllowed('https://example.com/page')).toBe(true);
  });

  it('should return crawl delay from wildcard rules', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': WILDCARD_ONLY_ROBOTS,
    });
    const parser = new RobotsParser(client);

    await parser.isAllowed('https://example.com/anything');

    expect(parser.getCrawlDelay()).toBe(3);
  });

  it('should return crawl delay from bot-specific rules', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BOT_SPECIFIC_ROBOTS,
    });
    const parser = new RobotsParser(client);

    await parser.isAllowed('https://example.com/anything');

    expect(parser.getCrawlDelay()).toBe(5);
  });

  it('should return null crawl delay when not set', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': `User-agent: *
Disallow: /private/`,
    });
    const parser = new RobotsParser(client);

    await parser.isAllowed('https://example.com/page');

    expect(parser.getCrawlDelay()).toBeNull();
  });

  it('should return null crawl delay when no domain has been fetched', () => {
    const client = createMockHttpClient({});
    const parser = new RobotsParser(client);

    expect(parser.getCrawlDelay()).toBeNull();
  });

  it('should extract Sitemap URLs', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BASIC_ROBOTS,
    });
    const parser = new RobotsParser(client);

    await parser.isAllowed('https://example.com/page');

    expect(parser.getSitemapUrls()).toEqual([
      'https://example.com/sitemap.xml',
      'https://example.com/sitemap2.xml',
    ]);
  });

  it('should return empty sitemap URLs when none declared', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': WILDCARD_ONLY_ROBOTS,
    });
    const parser = new RobotsParser(client);

    await parser.isAllowed('https://example.com/page');

    expect(parser.getSitemapUrls()).toEqual([]);
  });

  it('should cache parsed result per domain', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BASIC_ROBOTS,
    });
    const parser = new RobotsParser(client);

    await parser.isAllowed('https://example.com/page1');
    await parser.isAllowed('https://example.com/page2');
    await parser.isAllowed('https://example.com/page3');

    expect(client.fetch).toHaveBeenCalledTimes(1);
  });

  it('should fetch separately for different domains', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': BASIC_ROBOTS,
      'https://other.com/robots.txt': WILDCARD_ONLY_ROBOTS,
    });
    const parser = new RobotsParser(client);

    await parser.isAllowed('https://example.com/page');
    await parser.isAllowed('https://other.com/page');

    expect(client.fetch).toHaveBeenCalledTimes(2);
  });

  it('should allow everything when robots.txt fetch fails', async () => {
    const client = createMockHttpClient({});
    const parser = new RobotsParser(client);

    expect(await parser.isAllowed('https://missing.com/private/data')).toBe(true);
  });

  it('should handle comments in robots.txt', async () => {
    const client = createMockHttpClient({
      'https://example.com/robots.txt': `# This is a comment
User-agent: * # all bots
Disallow: /secret/ # keep out`,
    });
    const parser = new RobotsParser(client);

    expect(await parser.isAllowed('https://example.com/secret/file')).toBe(false);
    expect(await parser.isAllowed('https://example.com/public')).toBe(true);
  });
});
