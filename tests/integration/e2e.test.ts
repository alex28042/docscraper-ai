import { describe, it, expect } from 'vitest';
import { Crawler } from '../../src/crawling/crawler';
import { Discoverer } from '../../src/discovery/discoverer';
import { generateSkillTree } from '../../src/generation/generator';
import type { IHttpClient } from '../../src/interfaces/http-client';
import type { ISearchEngine, SearchResult } from '../../src/interfaces/search-engine';
import type { IContentWriter } from '../../src/interfaces/content-writer';
import { SemaphoreConcurrencyLimiter } from '../../src/http/concurrency-limiter';
import { CheerioHtmlParser } from '../../src/parsing/parser';
import { TurndownConverter } from '../../src/parsing/converter';
import { CheerioLinkExtractor } from '../../src/parsing/link-extractor';
import { NullLogger } from '../../src/interfaces/logger';

const SITE: Record<string, string> = {
  'https://docs.example.com/': `
    <html><head><title>Example Docs</title></head>
    <body><main>
      <h1>Welcome</h1>
      <p>Documentation for Example framework.</p>
      <a href="/getting-started">Getting Started</a>
      <a href="/api">API Reference</a>
    </main></body></html>
  `,
  'https://docs.example.com/getting-started': `
    <html><head><title>Getting Started</title></head>
    <body><main>
      <h1>Getting Started</h1>
      <p>Install with npm install example.</p>
      <a href="/api">API</a>
    </main></body></html>
  `,
  'https://docs.example.com/api': `
    <html><head><title>API Reference</title></head>
    <body><main>
      <h1>API Reference</h1>
      <p>The main entry point is the <code>create()</code> function.</p>
      <a href="/api/auth">Auth</a>
    </main></body></html>
  `,
  'https://docs.example.com/api/auth': `
    <html><head><title>Auth API</title></head>
    <body><main>
      <h1>Authentication</h1>
      <p>Use JWT tokens for authentication.</p>
    </main></body></html>
  `,
};

function createMockHttpClient(): IHttpClient {
  return {
    async fetch(url: string): Promise<string> {
      const html = SITE[url];
      if (!html) throw new Error(`404: ${url}`);
      return html;
    },
  };
}

function createMockSearchEngine(): ISearchEngine {
  return {
    async search(): Promise<SearchResult[]> {
      return [
        {
          url: 'https://docs.example.com/',
          title: 'Example Docs',
          snippet: 'Official documentation',
        },
        { url: 'https://github.com/example/example', title: 'GitHub Repo', snippet: 'Source code' },
        { url: 'https://stackoverflow.com/q/example', title: 'SO Question', snippet: 'How to use' },
      ];
    },
  };
}

function createMockWriter(): IContentWriter & { files: Map<string, string> } {
  const files = new Map<string, string>();
  return {
    files,
    writeFile(path: string, content: string) {
      files.set(path, content);
    },
    ensureDirectory() {},
  };
}

describe('E2E: Full pipeline (discover → crawl → generate)', () => {
  it('should discover documentation sources', async () => {
    const discoverer = new Discoverer(createMockSearchEngine());
    const results = await discoverer.discover('example framework');

    expect(results.length).toBeGreaterThanOrEqual(1);
    // Should filter out stackoverflow, keep docs.example.com and github
    const urls = results.map((r) => r.url);
    expect(urls.some((u) => u.includes('docs.example.com'))).toBe(true);
    expect(urls.every((u) => !u.includes('stackoverflow.com'))).toBe(true);
  });

  it('should crawl a multi-page site with depth', async () => {
    const crawler = new Crawler(
      createMockHttpClient(),
      new SemaphoreConcurrencyLimiter(2),
      new CheerioHtmlParser(),
      new TurndownConverter(),
      new CheerioLinkExtractor(),
      new NullLogger(),
    );

    const result = await crawler.crawl('https://docs.example.com/', {
      maxDepth: 3,
      maxPages: 10,
    });

    expect(result.pages).toHaveLength(4);
    expect(result.errors).toHaveLength(0);

    const urls = result.pages.map((p) => p.url);
    expect(urls).toContain('https://docs.example.com/');
    expect(urls).toContain('https://docs.example.com/getting-started');
    expect(urls).toContain('https://docs.example.com/api');
    expect(urls).toContain('https://docs.example.com/api/auth');

    // Verify markdown conversion
    const apiPage = result.pages.find((p) => p.url.includes('/api') && !p.url.includes('/auth'));
    expect(apiPage).toBeDefined();
    expect(apiPage!.markdown).toContain('API Reference');
    expect(apiPage!.markdown).toContain('`create()`');
  });

  it('should generate skill tree from crawl results', async () => {
    const crawler = new Crawler(
      createMockHttpClient(),
      new SemaphoreConcurrencyLimiter(2),
      new CheerioHtmlParser(),
      new TurndownConverter(),
      new CheerioLinkExtractor(),
      new NullLogger(),
    );

    const crawlResult = await crawler.crawl('https://docs.example.com/', {
      maxDepth: 3,
      maxPages: 10,
    });

    const writer = createMockWriter();
    const { files, indexPath } = generateSkillTree(crawlResult, '/out', writer);

    // Should have index + 4 page files
    expect(files.length).toBe(5);
    expect(indexPath).toBe('/out/_index.md');

    // Index should reference all pages
    const index = writer.files.get('/out/_index.md')!;
    expect(index).toContain('# Docs');
    expect(index).toContain('## Topics');

    // Page files should have navigation
    const authFile = Array.from(writer.files.entries()).find(([k]) => k.includes('auth'));
    expect(authFile).toBeDefined();
    expect(authFile![1]).toContain('[← Index](./_index.md)');
  });

  it('should handle full pipeline end-to-end', async () => {
    // 1. Discover
    const discoverer = new Discoverer(createMockSearchEngine());
    const sources = await discoverer.discover('example framework', 1);
    expect(sources.length).toBeGreaterThanOrEqual(1);

    const docUrl =
      sources.find((s) => s.url.includes('docs.example.com'))?.url ?? 'https://docs.example.com/';

    // 2. Crawl
    const crawler = new Crawler(
      createMockHttpClient(),
      new SemaphoreConcurrencyLimiter(2),
      new CheerioHtmlParser(),
      new TurndownConverter(),
      new CheerioLinkExtractor(),
      new NullLogger(),
    );
    const crawlResult = await crawler.crawl(docUrl, { maxDepth: 3, maxPages: 10 });
    expect(crawlResult.pages.length).toBeGreaterThan(0);
    expect(crawlResult.errors).toHaveLength(0);

    // 3. Generate
    const writer = createMockWriter();
    const { files } = generateSkillTree(crawlResult, '/output', writer);
    expect(files.length).toBeGreaterThan(1);

    // Verify all written files have content
    for (const [, content] of writer.files) {
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
