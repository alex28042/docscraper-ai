import { describe, it, expect } from 'vitest';
import { buildTree, pathToSlug } from '../../../src/generation/tree-builder';
import type { PageContent } from '../../../src/types';

function makePage(url: string, title: string): PageContent {
  return { url, title, description: '', markdown: 'content', links: [], fetchedAt: new Date() };
}

describe('pathToSlug', () => {
  it('should return index for root path', () => {
    expect(pathToSlug('https://example.com/docs/', '/docs')).toBe('index');
  });

  it('should create slug from path segments', () => {
    expect(pathToSlug('https://example.com/docs/api/charges', '/docs')).toBe('api--charges');
  });

  it('should lowercase and clean special characters', () => {
    expect(pathToSlug('https://example.com/docs/My_Page!', '/docs')).toBe('my-page');
  });

  it('should handle nested paths', () => {
    expect(pathToSlug('https://example.com/docs/a/b/c', '/docs')).toBe('a--b--c');
  });
});

describe('buildTree', () => {
  it('should create root nodes for top-level pages', () => {
    const pages = [
      makePage('https://example.com/docs/', 'Index'),
      makePage('https://example.com/docs/api', 'API'),
    ];
    const roots = buildTree(pages, 'https://example.com/docs/');
    expect(roots.length).toBeGreaterThanOrEqual(1);
  });

  it('should nest children under parents', () => {
    const pages = [
      makePage('https://example.com/docs/api', 'API'),
      makePage('https://example.com/docs/api/charges', 'Charges'),
    ];
    const roots = buildTree(pages, 'https://example.com/docs/');
    const apiNode = roots.find((r) => r.title === 'API');
    expect(apiNode).toBeDefined();
    expect(apiNode!.children).toHaveLength(1);
    expect(apiNode!.children[0].title).toBe('Charges');
  });

  it('should sort children alphabetically', () => {
    const pages = [
      makePage('https://example.com/docs/api', 'API'),
      makePage('https://example.com/docs/api/zebra', 'Zebra'),
      makePage('https://example.com/docs/api/alpha', 'Alpha'),
    ];
    const roots = buildTree(pages, 'https://example.com/docs/');
    const apiNode = roots.find((r) => r.title === 'API');
    expect(apiNode!.children[0].title).toBe('Alpha');
    expect(apiNode!.children[1].title).toBe('Zebra');
  });

  it('should handle flat pages with no nesting', () => {
    const pages = [
      makePage('https://example.com/docs/a', 'A'),
      makePage('https://example.com/docs/b', 'B'),
    ];
    const roots = buildTree(pages, 'https://example.com/docs/');
    expect(roots).toHaveLength(2);
  });
});
