import { describe, it, expect } from 'vitest';
import { CheerioLinkExtractor, filterLinks } from '../../../src/parsing/link-extractor';

describe('CheerioLinkExtractor', () => {
  const extractor = new CheerioLinkExtractor();
  const base = 'https://example.com/docs';

  it('should extract same-origin links', () => {
    const html = `
      <a href="/docs/api">API</a>
      <a href="/docs/guide">Guide</a>
    `;
    const links = extractor.extract(html, base);
    expect(links).toContain('https://example.com/docs/api');
    expect(links).toContain('https://example.com/docs/guide');
  });

  it('should filter out cross-origin links', () => {
    const html = `
      <a href="/local">Local</a>
      <a href="https://other.com/page">External</a>
    `;
    const links = extractor.extract(html, base);
    expect(links).toContain('https://example.com/local');
    expect(links).not.toContain('https://other.com/page');
  });

  it('should strip hashes', () => {
    const html = '<a href="/docs/page#section">Link</a>';
    const links = extractor.extract(html, base);
    expect(links).toContain('https://example.com/docs/page');
    expect(links.some((l) => l.includes('#'))).toBe(false);
  });

  it('should deduplicate links', () => {
    const html = `
      <a href="/docs/page">Link 1</a>
      <a href="/docs/page">Link 2</a>
      <a href="/docs/page#hash">Link 3</a>
    `;
    const links = extractor.extract(html, base);
    const pageLinks = links.filter((l) => l.includes('/docs/page'));
    expect(pageLinks).toHaveLength(1);
  });

  it('should normalize trailing slashes', () => {
    const html = `
      <a href="/docs/page/">With slash</a>
      <a href="/docs/page">Without slash</a>
    `;
    const links = extractor.extract(html, base);
    const pageLinks = links.filter((l) => l.includes('/docs/page'));
    expect(pageLinks).toHaveLength(1);
  });

  it('should skip malformed URLs', () => {
    const html = '<a href="javascript:void(0)">Bad</a><a href="/good">Good</a>';
    const links = extractor.extract(html, base);
    expect(links).toHaveLength(1);
    expect(links[0]).toContain('/good');
  });

  it('should handle empty href', () => {
    const html = '<a href="">Empty</a><a>No href</a>';
    const links = extractor.extract(html, base);
    // Empty href resolves to baseUrl
    expect(links.length).toBeLessThanOrEqual(1);
  });
});

describe('filterLinks', () => {
  const links = [
    'https://example.com/docs/api',
    'https://example.com/docs/guide',
    'https://example.com/blog/post',
    'https://example.com/docs/reference',
  ];

  it('should return all links when no patterns', () => {
    expect(filterLinks(links, [], [])).toEqual(links);
  });

  it('should include only matching patterns', () => {
    const result = filterLinks(links, ['/docs/'], []);
    expect(result).toHaveLength(3);
    expect(result.every((l) => l.includes('/docs/'))).toBe(true);
  });

  it('should exclude matching patterns', () => {
    const result = filterLinks(links, [], ['/blog/']);
    expect(result).toHaveLength(3);
    expect(result.every((l) => !l.includes('/blog/'))).toBe(true);
  });

  it('should apply both include and exclude', () => {
    const result = filterLinks(links, ['/docs/'], ['reference']);
    expect(result).toHaveLength(2);
    expect(result).toContain('https://example.com/docs/api');
    expect(result).toContain('https://example.com/docs/guide');
  });
});
