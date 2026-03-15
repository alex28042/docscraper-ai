import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FsCrawlStateStore } from '../../src/crawling/fs-crawl-state';
import type { CrawlState } from '../../src/types';
import { toUrl, toPageTitle, toMetaDescription, toMarkdownContent } from '../../src/types';

describe('FsCrawlStateStore', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crawl-state-test-'));
  const statePath = path.join(tmpDir, 'state.json');
  const store = new FsCrawlStateStore(statePath);

  afterEach(async () => {
    await store.clear();
  });

  const mockState: CrawlState = {
    visited: ['https://example.com', 'https://example.com/page1'],
    queue: [['https://example.com/page2', 1]],
    pages: [
      {
        url: toUrl('https://example.com'),
        title: toPageTitle('Home'),
        description: toMetaDescription('Homepage'),
        markdown: toMarkdownContent('# Home'),
        links: [],
        fetchedAt: new Date('2024-01-01'),
      },
    ],
    errors: [],
    startedAt: new Date('2024-01-01'),
    startUrl: 'https://example.com',
  };

  it('returns undefined when no state exists', async () => {
    const state = await store.load();
    expect(state).toBeUndefined();
  });

  it('saves and loads state', async () => {
    await store.save(mockState);
    const loaded = await store.load();

    expect(loaded).toBeDefined();
    expect(loaded!.visited).toEqual(mockState.visited);
    expect(loaded!.queue).toEqual(mockState.queue);
    expect(loaded!.pages).toHaveLength(1);
    expect(loaded!.pages[0].url).toBe('https://example.com');
    expect(loaded!.startUrl).toBe('https://example.com');
    expect(loaded!.startedAt).toBeInstanceOf(Date);
  });

  it('clears state', async () => {
    await store.save(mockState);
    await store.clear();
    const loaded = await store.load();
    expect(loaded).toBeUndefined();
  });

  it('overwrites existing state', async () => {
    await store.save(mockState);
    const updated = { ...mockState, visited: ['https://example.com'] };
    await store.save(updated);
    const loaded = await store.load();
    expect(loaded!.visited).toEqual(['https://example.com']);
  });
});
