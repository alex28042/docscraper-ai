import { describe, it, expect } from 'vitest';
import { CheerioHtmlParser } from '../../../src/parsing/parser';

describe('CheerioHtmlParser', () => {
  const parser = new CheerioHtmlParser();

  it('should extract title from <title> tag', () => {
    const html = '<html><head><title>My Page</title></head><body><p>content</p></body></html>';
    const result = parser.parse(html, 'https://example.com/page');
    expect(result.title).toBe('My Page');
  });

  it('should fallback to <h1> when no <title>', () => {
    const html = '<html><body><h1>Heading</h1><p>content</p></body></html>';
    const result = parser.parse(html, 'https://example.com/page');
    expect(result.title).toBe('Heading');
  });

  it('should fallback to pathname when no title or h1', () => {
    const html = '<html><body><p>content</p></body></html>';
    const result = parser.parse(html, 'https://example.com/some/path');
    expect(result.title).toBe('/some/path');
  });

  it('should extract meta description', () => {
    const html =
      '<html><head><meta name="description" content="A description"></head><body></body></html>';
    const result = parser.parse(html, 'https://example.com');
    expect(result.description).toBe('A description');
  });

  it('should extract og:description as fallback', () => {
    const html =
      '<html><head><meta property="og:description" content="OG desc"></head><body></body></html>';
    const result = parser.parse(html, 'https://example.com');
    expect(result.description).toBe('OG desc');
  });

  it('should remove noise elements', () => {
    const html = `
      <html><body>
        <nav>Nav content</nav>
        <main><p>Main content</p></main>
        <footer>Footer</footer>
      </body></html>
    `;
    const result = parser.parse(html, 'https://example.com');
    expect(result.mainHtml).toContain('Main content');
    expect(result.mainHtml).not.toContain('Nav content');
    expect(result.mainHtml).not.toContain('Footer');
  });

  it('should use <article> as content selector', () => {
    const html = `
      <html><body>
        <div class="sidebar">Side</div>
        <article><p>Article content</p></article>
      </body></html>
    `;
    const result = parser.parse(html, 'https://example.com');
    expect(result.mainHtml).toContain('Article content');
  });

  it('should fallback to <body> when no content selector matches', () => {
    const html = '<html><body><div><p>Body content</p></div></body></html>';
    const result = parser.parse(html, 'https://example.com');
    expect(result.mainHtml).toContain('Body content');
  });

  it('should accept custom selectors', () => {
    const customParser = new CheerioHtmlParser({
      removeSelectors: ['nav'],
      contentSelectors: ['.custom-content'],
    });
    const html = `
      <html><body>
        <nav>Nav</nav>
        <div class="custom-content"><p>Custom</p></div>
        <main><p>Main</p></main>
      </body></html>
    `;
    const result = customParser.parse(html, 'https://example.com');
    expect(result.mainHtml).toContain('Custom');
    expect(result.mainHtml).not.toContain('Main');
  });
});
