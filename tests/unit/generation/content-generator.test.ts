import { describe, it, expect } from 'vitest';
import { generateIndex, generatePageFile } from '../../../src/generation/content-generator';
import type { TreeNode, CrawlResult } from '../../../src/types';

function makeNode(slug: string, title: string, children: TreeNode[] = []): TreeNode {
  return {
    slug,
    title,
    url: `https://example.com/${slug}`,
    markdown: 'Some content',
    children,
    parentSlug: '',
  };
}

describe('generateIndex', () => {
  it('should include topic name as heading', () => {
    const result: CrawlResult = {
      startUrl: 'https://example.com/docs',
      pages: [],
      errors: [],
      stats: {
        totalPages: 2,
        totalErrors: 0,
        durationMs: 100,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    };
    const roots = [makeNode('api', 'API')];
    const output = generateIndex(roots, result, 'Example Docs');
    expect(output).toContain('# Example Docs');
  });

  it('should include links to pages', () => {
    const result: CrawlResult = {
      startUrl: 'https://example.com/docs',
      pages: [],
      errors: [],
      stats: {
        totalPages: 1,
        totalErrors: 0,
        durationMs: 100,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    };
    const roots = [makeNode('api', 'API')];
    const output = generateIndex(roots, result, 'Docs');
    expect(output).toContain('[API](./api.md)');
  });

  it('should render nested tree', () => {
    const child = makeNode('api--charges', 'Charges');
    const parent = makeNode('api', 'API', [child]);
    const result: CrawlResult = {
      startUrl: 'https://example.com/docs',
      pages: [],
      errors: [],
      stats: {
        totalPages: 2,
        totalErrors: 0,
        durationMs: 100,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    };
    const output = generateIndex([parent], result, 'Docs');
    expect(output).toContain('[API](./api.md)');
    expect(output).toContain('[Charges](./api--charges.md)');
  });
});

describe('generatePageFile', () => {
  it('should include title and source', () => {
    const node = makeNode('api', 'API Reference');
    const allNodes = new Map<string, TreeNode>([['api', node]]);
    const output = generatePageFile(node, allNodes);
    expect(output).toContain('# API Reference');
    expect(output).toContain('> Source: https://example.com/api');
  });

  it('should include index navigation', () => {
    const node = makeNode('api', 'API');
    const allNodes = new Map<string, TreeNode>([['api', node]]);
    const output = generatePageFile(node, allNodes);
    expect(output).toContain('[← Index](./_index.md)');
  });

  it('should include parent navigation when parent exists', () => {
    const parent = makeNode('api', 'API');
    const child = makeNode('api--charges', 'Charges');
    child.parentSlug = 'api';
    const allNodes = new Map<string, TreeNode>([
      ['api', parent],
      ['api--charges', child],
    ]);
    parent.children = [child];
    const output = generatePageFile(child, allNodes);
    expect(output).toContain('[↑ API](./api.md)');
  });

  it('should include related links', () => {
    const child1 = makeNode('api--a', 'A');
    const child2 = makeNode('api--b', 'B');
    const parent = makeNode('api', 'API', [child1, child2]);
    child1.parentSlug = 'api';
    child2.parentSlug = 'api';
    const allNodes = new Map<string, TreeNode>([
      ['api', parent],
      ['api--a', child1],
      ['api--b', child2],
    ]);
    const output = generatePageFile(child1, allNodes);
    expect(output).toContain('**Related:**');
    expect(output).toContain('[B](./api--b.md)');
  });
});
