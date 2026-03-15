import { describe, it, expect } from 'vitest';
import { CheerioMetadataExtractor } from '../../../src/parsing/metadata-extractor';

describe('CheerioMetadataExtractor', () => {
  const extractor = new CheerioMetadataExtractor();

  it('extracts Open Graph metadata', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="My Page">
          <meta property="og:description" content="A great page">
          <meta property="og:image" content="https://example.com/img.png">
        </head>
        <body>Hello</body>
      </html>
    `;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.ogTitle).toBe('My Page');
    expect(meta.ogDescription).toBe('A great page');
    expect(meta.ogImage).toBe('https://example.com/img.png');
  });

  it('extracts canonical URL', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://example.com/canonical">
        </head>
        <body>Hello</body>
      </html>
    `;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.canonicalUrl).toBe('https://example.com/canonical');
  });

  it('extracts language from html lang attribute', () => {
    const html = `<html lang="en-US"><head></head><body>Hello</body></html>`;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.language).toBe('en-US');
  });

  it('extracts author', () => {
    const html = `
      <html>
        <head><meta name="author" content="John Doe"></head>
        <body>Hello</body>
      </html>
    `;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.author).toBe('John Doe');
  });

  it('extracts last-modified date', () => {
    const html = `
      <html>
        <head><meta name="last-modified" content="2024-01-15"></head>
        <body>Hello</body>
      </html>
    `;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.lastModified).toBe('2024-01-15');
  });

  it('detects deprecated pages by class name', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <div class="deprecated-notice">This API is deprecated</div>
        </body>
      </html>
    `;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.deprecated).toBe(true);
    expect(meta.deprecationMessage).toBe('This API is deprecated');
  });

  it('detects deprecated pages by body text', () => {
    const html = `
      <html>
        <head></head>
        <body>This page is deprecated and will be removed soon.</body>
      </html>
    `;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.deprecated).toBe(true);
  });

  it('returns deprecated=false for normal pages', () => {
    const html = `<html><head></head><body>Normal content</body></html>`;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.deprecated).toBe(false);
  });

  it('extracts version from meta tag', () => {
    const html = `
      <html>
        <head><meta name="docsearch:version" content="3.0"></head>
        <body>Hello</body>
      </html>
    `;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.version).toBe('3.0');
  });

  it('returns undefined for missing fields', () => {
    const html = `<html><head></head><body>Hello</body></html>`;
    const meta = extractor.extract(html, 'https://example.com');
    expect(meta.author).toBeUndefined();
    expect(meta.canonicalUrl).toBeUndefined();
    expect(meta.ogTitle).toBeUndefined();
    expect(meta.lastModified).toBeUndefined();
    expect(meta.version).toBeUndefined();
  });
});
