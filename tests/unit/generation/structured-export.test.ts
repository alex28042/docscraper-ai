import { describe, it, expect } from 'vitest';
import {
  extractHeadings,
  toStructuredPage,
  exportToStructuredJson,
} from '../../../src/generation/structured-export';
import type { PageContent, CrawlResult, CrawlStats } from '../../../src/types';
import {
  toUrl,
  toPageTitle,
  toMetaDescription,
  toMarkdownContent,
  toMilliseconds,
} from '../../../src/types';

describe('extractHeadings', () => {
  it('extracts flat headings', () => {
    const md = '# Title\n\n## Section 1\n\n## Section 2\n';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe('Title');
    expect(headings[0].children).toHaveLength(2);
  });

  it('builds nested heading tree', () => {
    const md = '# Title\n## Sub1\n### Sub1a\n## Sub2\n';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(1);
    expect(headings[0].children).toHaveLength(2);
    expect(headings[0].children[0].children).toHaveLength(1);
    expect(headings[0].children[0].children[0].text).toBe('Sub1a');
  });

  it('handles empty markdown', () => {
    expect(extractHeadings('')).toEqual([]);
  });

  it('handles markdown with no headings', () => {
    expect(extractHeadings('Just some text\nMore text')).toEqual([]);
  });

  it('handles multiple top-level headings', () => {
    const md = '# First\n# Second\n# Third\n';
    const headings = extractHeadings(md);
    expect(headings).toHaveLength(3);
  });
});

describe('toStructuredPage', () => {
  const page: PageContent = {
    url: toUrl('https://example.com'),
    title: toPageTitle('Test Page'),
    description: toMetaDescription('A test page'),
    markdown: toMarkdownContent('# Title\n\n```js\nconsole.log("hello")\n```\n'),
    links: [],
    fetchedAt: new Date(),
  };

  it('converts page to structured format', () => {
    const result = toStructuredPage(page);
    expect(result.url).toBe('https://example.com');
    expect(result.title).toBe('Test Page');
    expect(result.headings).toHaveLength(1);
    expect(result.codeBlocks).toHaveLength(1);
    expect(result.markdown).toContain('# Title');
  });

  it('uses custom code blocks when provided', () => {
    const result = toStructuredPage(page, ['custom block']);
    expect(result.codeBlocks).toEqual(['custom block']);
  });
});

describe('exportToStructuredJson', () => {
  it('exports full crawl result', () => {
    const stats: CrawlStats = {
      totalPages: 1,
      totalErrors: 0,
      durationMs: toMilliseconds(100),
      startedAt: new Date(),
      completedAt: new Date(),
      duplicatesSkipped: 0,
    };

    const result: CrawlResult = {
      startUrl: toUrl('https://example.com'),
      pages: [
        {
          url: toUrl('https://example.com'),
          title: toPageTitle('Home'),
          description: toMetaDescription('Homepage'),
          markdown: toMarkdownContent('# Home\n'),
          links: [],
          fetchedAt: new Date(),
        },
      ],
      errors: [],
      stats,
    };

    const exported = exportToStructuredJson(result);
    expect(exported.startUrl).toBe('https://example.com');
    expect(exported.pages).toHaveLength(1);
    expect(exported.pages[0].headings).toHaveLength(1);
    expect(exported.exportedAt).toBeInstanceOf(Date);
  });
});
