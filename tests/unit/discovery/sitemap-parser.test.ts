import { describe, it, expect, vi } from 'vitest';
import type { IHttpClient } from '../../../src/interfaces/http-client';
import { SitemapParser } from '../../../src/discovery/sitemap-parser';

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

const SIMPLE_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/page1</loc></url>
  <url><loc>https://example.com/page2</loc></url>
  <url><loc>https://example.com/page3</loc></url>
</urlset>`;

const SITEMAP_INDEX = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap1.xml</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>
</sitemapindex>`;

const CHILD_SITEMAP_1 = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/a</loc></url>
</urlset>`;

const CHILD_SITEMAP_2 = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/b</loc></url>
  <url><loc>https://example.com/c</loc></url>
</urlset>`;

describe('SitemapParser', () => {
  it('should extract URLs from a simple sitemap', async () => {
    const client = createMockHttpClient({
      'https://example.com/sitemap.xml': SIMPLE_SITEMAP,
    });
    const parser = new SitemapParser(client);

    const urls = await parser.parse('https://example.com/sitemap.xml');

    expect(urls).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3',
    ]);
  });

  it('should handle sitemap index files by following child sitemaps', async () => {
    const client = createMockHttpClient({
      'https://example.com/sitemap.xml': SITEMAP_INDEX,
      'https://example.com/sitemap1.xml': CHILD_SITEMAP_1,
      'https://example.com/sitemap2.xml': CHILD_SITEMAP_2,
    });
    const parser = new SitemapParser(client);

    const urls = await parser.parse('https://example.com/sitemap.xml');

    expect(urls).toEqual([
      'https://example.com/a',
      'https://example.com/b',
      'https://example.com/c',
    ]);
  });

  it('should skip gzipped sitemap URLs', async () => {
    const client = createMockHttpClient({});
    const parser = new SitemapParser(client);

    const urls = await parser.parse('https://example.com/sitemap.xml.gz');

    expect(urls).toEqual([]);
    expect(client.fetch).not.toHaveBeenCalled();
  });

  it('should skip gzipped child sitemaps in a sitemap index', async () => {
    const indexWithGz = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://example.com/sitemap1.xml.gz</loc></sitemap>
  <sitemap><loc>https://example.com/sitemap2.xml</loc></sitemap>
</sitemapindex>`;

    const client = createMockHttpClient({
      'https://example.com/sitemap.xml': indexWithGz,
      'https://example.com/sitemap2.xml': CHILD_SITEMAP_2,
    });
    const parser = new SitemapParser(client);

    const urls = await parser.parse('https://example.com/sitemap.xml');

    expect(urls).toEqual(['https://example.com/b', 'https://example.com/c']);
  });

  it('should return empty array when fetch fails', async () => {
    const client = createMockHttpClient({});
    const parser = new SitemapParser(client);

    const urls = await parser.parse('https://example.com/sitemap.xml');

    expect(urls).toEqual([]);
  });

  it('should return empty array for empty sitemap', async () => {
    const client = createMockHttpClient({
      'https://example.com/sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
    });
    const parser = new SitemapParser(client);

    const urls = await parser.parse('https://example.com/sitemap.xml');

    expect(urls).toEqual([]);
  });

  it('should gracefully handle failed child sitemap fetches', async () => {
    const client = createMockHttpClient({
      'https://example.com/sitemap.xml': SITEMAP_INDEX,
      'https://example.com/sitemap1.xml': CHILD_SITEMAP_1,
      // sitemap2.xml is missing — will throw
    });
    const parser = new SitemapParser(client);

    const urls = await parser.parse('https://example.com/sitemap.xml');

    expect(urls).toEqual(['https://example.com/a']);
  });
});
