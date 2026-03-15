import { describe, it, expect } from 'vitest';
import { generateSkillTree } from '../../src/generation/generator';
import type { IContentWriter } from '../../src/interfaces/content-writer';
import type { CrawlResult } from '../../src/types';

function createMockWriter(): IContentWriter & { files: Map<string, string>; dirs: string[] } {
  const files = new Map<string, string>();
  const dirs: string[] = [];
  return {
    files,
    dirs,
    writeFile(filePath: string, content: string): void {
      files.set(filePath, content);
    },
    ensureDirectory(dirPath: string): void {
      dirs.push(dirPath);
    },
  };
}

describe('Generator integration', () => {
  const crawlResult: CrawlResult = {
    startUrl: 'https://example.com/docs/',
    pages: [
      {
        url: 'https://example.com/docs/',
        title: 'Docs Home',
        description: 'Home page',
        markdown: 'Welcome to the docs',
        links: [],
        fetchedAt: new Date(),
      },
      {
        url: 'https://example.com/docs/api',
        title: 'API Reference',
        description: 'API docs',
        markdown: 'API content here',
        links: [],
        fetchedAt: new Date(),
      },
      {
        url: 'https://example.com/docs/api/auth',
        title: 'Auth API',
        description: 'Authentication',
        markdown: 'Auth endpoint docs',
        links: [],
        fetchedAt: new Date(),
      },
    ],
    errors: [],
    stats: {
      totalPages: 3,
      totalErrors: 0,
      durationMs: 500,
      startedAt: new Date(),
      completedAt: new Date(),
      duplicatesSkipped: 0,
    },
  };

  it('should create output directory', () => {
    const writer = createMockWriter();
    generateSkillTree(crawlResult, '/tmp/output', writer);
    expect(writer.dirs).toContain('/tmp/output');
  });

  it('should write index file', () => {
    const writer = createMockWriter();
    const result = generateSkillTree(crawlResult, '/tmp/output', writer);
    expect(result.files).toContain('_index.md');
    expect(writer.files.has('/tmp/output/_index.md')).toBe(true);
  });

  it('should write a file for each page', () => {
    const writer = createMockWriter();
    const result = generateSkillTree(crawlResult, '/tmp/output', writer);
    // 3 pages + 1 index = 4 files
    expect(result.files.length).toBe(4);
  });

  it('should generate correct index content', () => {
    const writer = createMockWriter();
    generateSkillTree(crawlResult, '/tmp/output', writer);
    const indexContent = writer.files.get('/tmp/output/_index.md')!;
    expect(indexContent).toContain('# Example Docs');
    expect(indexContent).toContain('## Topics');
  });

  it('should generate page files with navigation', () => {
    const writer = createMockWriter();
    generateSkillTree(crawlResult, '/tmp/output', writer);

    // Find the API page file
    const apiFile = Array.from(writer.files.entries()).find(
      ([k]) => k.includes('api.md') && !k.includes('auth'),
    );
    expect(apiFile).toBeDefined();
    const [, content] = apiFile!;
    expect(content).toContain('# API Reference');
    expect(content).toContain('[← Index](./_index.md)');
  });

  it('should nest child pages under parent', () => {
    const writer = createMockWriter();
    generateSkillTree(crawlResult, '/tmp/output', writer);

    // Auth page should have parent nav to API
    const authFile = Array.from(writer.files.entries()).find(([k]) => k.includes('auth'));
    expect(authFile).toBeDefined();
    const [, content] = authFile!;
    expect(content).toContain('API Reference');
  });
});
