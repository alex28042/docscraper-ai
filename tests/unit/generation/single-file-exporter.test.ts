import { describe, it, expect, vi } from 'vitest';
import {
  exportToSingleFile,
  exportToSingleFileAndWrite,
} from '../../../src/generation/single-file-exporter';
import type { CrawlResult } from '../../../src/types';
import type { IContentWriter } from '../../../src/interfaces';

function makeCrawlResult(pageCount: number): CrawlResult {
  const pages = Array.from({ length: pageCount }, (_, i) => ({
    url: `https://example.com/page-${i + 1}`,
    title: `Page ${i + 1}`,
    description: '',
    markdown: `Content for page ${i + 1}`,
    links: [],
    fetchedAt: new Date('2025-01-15T10:00:00Z'),
  }));

  return {
    startUrl: 'https://example.com/',
    pages,
    errors: [],
    stats: {
      totalPages: pageCount,
      totalErrors: 0,
      durationMs: 1500,
      startedAt: new Date('2025-01-15T10:00:00Z'),
      completedAt: new Date('2025-01-15T10:00:01.500Z'),
      duplicatesSkipped: 0,
    },
  } as CrawlResult;
}

describe('exportToSingleFile', () => {
  it('should include metadata header by default', () => {
    const result = makeCrawlResult(2);
    const output = exportToSingleFile(result);

    expect(output).toContain('# Crawl Export');
    expect(output).toContain('**Start URL:** https://example.com/');
    expect(output).toContain('**Total pages:** 2');
    expect(output).toContain('**Duration:** 1.5s');
    expect(output).toContain('**Date:** 2025-01-15');
  });

  it('should omit metadata header when includeMetadata is false', () => {
    const result = makeCrawlResult(1);
    const output = exportToSingleFile(result, { includeMetadata: false });

    expect(output).not.toContain('# Crawl Export');
    expect(output).not.toContain('**Start URL:**');
    expect(output).toContain('## Page 1');
  });

  it('should format each page with title and source', () => {
    const result = makeCrawlResult(2);
    const output = exportToSingleFile(result, { includeMetadata: false });

    expect(output).toContain('## Page 1');
    expect(output).toContain('> Source: https://example.com/page-1');
    expect(output).toContain('Content for page 1');
    expect(output).toContain('## Page 2');
    expect(output).toContain('> Source: https://example.com/page-2');
    expect(output).toContain('Content for page 2');
  });

  it('should use default separator between pages', () => {
    const result = makeCrawlResult(2);
    const output = exportToSingleFile(result, { includeMetadata: false });

    expect(output).toContain('\n\n---\n\n');
  });

  it('should use custom separator when provided', () => {
    const result = makeCrawlResult(2);
    const output = exportToSingleFile(result, {
      includeMetadata: false,
      separator: '\n\n===\n\n',
    });

    expect(output).toContain('\n\n===\n\n');
    expect(output).not.toContain('\n\n---\n\n');
  });

  it('should handle zero pages with metadata', () => {
    const result = makeCrawlResult(0);
    const output = exportToSingleFile(result);

    expect(output).toContain('# Crawl Export');
    expect(output).toContain('**Total pages:** 0');
  });

  it('should end with newline', () => {
    const result = makeCrawlResult(1);
    const output = exportToSingleFile(result);

    expect(output.endsWith('\n')).toBe(true);
  });
});

describe('exportToSingleFileAndWrite', () => {
  it('should write generated content via IContentWriter', () => {
    const result = makeCrawlResult(1);
    const writer: IContentWriter = {
      writeFile: vi.fn(),
      ensureDirectory: vi.fn(),
    };

    exportToSingleFileAndWrite(result, '/output/export.md', writer);

    expect(writer.writeFile).toHaveBeenCalledOnce();
    expect(writer.writeFile).toHaveBeenCalledWith(
      '/output/export.md',
      expect.stringContaining('## Page 1'),
    );
  });

  it('should pass options through to exportToSingleFile', () => {
    const result = makeCrawlResult(1);
    const writer: IContentWriter = {
      writeFile: vi.fn(),
      ensureDirectory: vi.fn(),
    };

    exportToSingleFileAndWrite(result, '/output/export.md', writer, { includeMetadata: false });

    const writtenContent = (writer.writeFile as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(writtenContent).not.toContain('# Crawl Export');
  });
});
