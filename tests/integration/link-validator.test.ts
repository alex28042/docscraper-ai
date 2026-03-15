import { describe, it, expect } from 'vitest';
import { validateLinks } from '../../src/parsing/link-validator';
import type { IHttpClient } from '../../src/interfaces/http-client';
import type { PageContent } from '../../src/types';
import { toUrl, toPageTitle, toMetaDescription, toMarkdownContent } from '../../src/types';

function makePage(url: string, links: string[]): PageContent {
  return {
    url: toUrl(url),
    title: toPageTitle('Test'),
    description: toMetaDescription(''),
    markdown: toMarkdownContent(''),
    links: links.map(toUrl),
    fetchedAt: new Date(),
  };
}

describe('validateLinks', () => {
  const mockHttpClient: IHttpClient = {
    async fetch(url: string) {
      if (url.includes('broken')) {
        throw new Error('404 Not Found');
      }
      return '<html></html>';
    },
  };

  it('validates internal links against crawled pages', async () => {
    const pages = [
      makePage('https://example.com', ['https://example.com/page1', 'https://example.com/missing']),
      makePage('https://example.com/page1', []),
    ];

    const report = await validateLinks(pages, mockHttpClient);
    expect(report.total).toBe(2);
    expect(report.valid).toBe(1);
    expect(report.broken).toBe(1);

    const brokenLink = report.links.find((l) => l.url === 'https://example.com/missing');
    expect(brokenLink).toBeDefined();
    expect(brokenLink!.isValid).toBe(false);
  });

  it('skips external link validation by default', async () => {
    const pages = [makePage('https://example.com', ['https://other.com/page'])];

    const report = await validateLinks(pages, mockHttpClient);
    expect(report.total).toBe(1);
    expect(report.links[0].isExternal).toBe(true);
    expect(report.links[0].isValid).toBe(true); // assumed valid
  });

  it('validates external links when opted in', async () => {
    const pages = [makePage('https://example.com', ['https://other.com/broken'])];

    const report = await validateLinks(pages, mockHttpClient, { checkExternal: true });
    expect(report.broken).toBe(1);
    expect(report.links[0].isValid).toBe(false);
  });

  it('tracks referenced-from pages', async () => {
    const pages = [
      makePage('https://example.com', ['https://example.com/page1']),
      makePage('https://example.com/about', ['https://example.com/page1']),
      makePage('https://example.com/page1', []),
    ];

    const report = await validateLinks(pages, mockHttpClient);
    const page1Link = report.links.find((l) => l.url === 'https://example.com/page1');
    expect(page1Link!.referencedFrom).toHaveLength(2);
    expect(page1Link!.referencedFrom).toContain('https://example.com');
    expect(page1Link!.referencedFrom).toContain('https://example.com/about');
  });

  it('handles pages with no links', async () => {
    const pages = [makePage('https://example.com', [])];
    const report = await validateLinks(pages, mockHttpClient);
    expect(report.total).toBe(0);
    expect(report.valid).toBe(0);
    expect(report.broken).toBe(0);
  });
});
