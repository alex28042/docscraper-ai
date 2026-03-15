import { describe, it, expect } from 'vitest';
import { diffCrawls, exportCrawlResult, importCrawlResult } from '../../../src/generation/diff';
import type { CrawlResult } from '../../../src/types';
import {
  toUrl,
  toPageTitle,
  toMetaDescription,
  toMarkdownContent,
  toMilliseconds,
} from '../../../src/types';

function makePage(url: string, title: string, markdown: string) {
  return {
    url: toUrl(url),
    title: toPageTitle(title),
    description: toMetaDescription(''),
    markdown: toMarkdownContent(markdown),
    links: [],
    fetchedAt: new Date('2024-01-01'),
  };
}

function makeResult(pages: ReturnType<typeof makePage>[]): CrawlResult {
  return {
    startUrl: toUrl('https://example.com'),
    pages,
    errors: [],
    stats: {
      totalPages: pages.length,
      totalErrors: 0,
      durationMs: toMilliseconds(100),
      startedAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-01'),
      duplicatesSkipped: 0,
    },
  };
}

describe('diffCrawls', () => {
  it('detects added pages', () => {
    const previous = makeResult([makePage('https://example.com/a', 'A', 'content A')]);
    const current = makeResult([
      makePage('https://example.com/a', 'A', 'content A'),
      makePage('https://example.com/b', 'B', 'content B'),
    ]);
    const diff = diffCrawls(previous, current);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].url).toBe('https://example.com/b');
    expect(diff.summary.added).toBe(1);
  });

  it('detects removed pages', () => {
    const previous = makeResult([
      makePage('https://example.com/a', 'A', 'content A'),
      makePage('https://example.com/b', 'B', 'content B'),
    ]);
    const current = makeResult([makePage('https://example.com/a', 'A', 'content A')]);
    const diff = diffCrawls(previous, current);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0].url).toBe('https://example.com/b');
    expect(diff.summary.removed).toBe(1);
  });

  it('detects modified pages', () => {
    const previous = makeResult([makePage('https://example.com/a', 'A', 'old content')]);
    const current = makeResult([makePage('https://example.com/a', 'A', 'new content')]);
    const diff = diffCrawls(previous, current);
    expect(diff.modified).toHaveLength(1);
    expect(diff.summary.modified).toBe(1);
  });

  it('detects unchanged pages', () => {
    const previous = makeResult([makePage('https://example.com/a', 'A', 'same content')]);
    const current = makeResult([makePage('https://example.com/a', 'A', 'same content')]);
    const diff = diffCrawls(previous, current);
    expect(diff.unchanged).toHaveLength(1);
    expect(diff.summary.unchanged).toBe(1);
  });

  it('handles empty results', () => {
    const diff = diffCrawls(makeResult([]), makeResult([]));
    expect(diff.summary).toEqual({ added: 0, removed: 0, modified: 0, unchanged: 0 });
  });
});

describe('exportCrawlResult / importCrawlResult', () => {
  it('round-trips a crawl result', () => {
    const original = makeResult([makePage('https://example.com/a', 'A', 'content')]);
    const json = exportCrawlResult(original);
    const restored = importCrawlResult(json);

    expect(restored.startUrl).toBe(original.startUrl);
    expect(restored.pages).toHaveLength(1);
    expect(restored.pages[0].url).toBe('https://example.com/a');
    expect(restored.stats.startedAt).toBeInstanceOf(Date);
    expect(restored.pages[0].fetchedAt).toBeInstanceOf(Date);
  });
});
