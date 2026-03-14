import { describe, it, expect } from 'vitest';
import { Discoverer } from '../../src/discovery/discoverer';
import type { ISearchEngine, SearchResult } from '../../src/interfaces/search-engine';

function createMockSearchEngine(results: SearchResult[]): ISearchEngine {
  return {
    async search(): Promise<SearchResult[]> {
      return results;
    },
  };
}

describe('Discoverer integration', () => {
  it('should return scored and deduplicated results', async () => {
    const engine = createMockSearchEngine([
      { url: 'https://docs.hono.dev/api', title: 'Hono API', snippet: 'API docs' },
      { url: 'https://docs.hono.dev/guide', title: 'Hono Guide', snippet: 'Guide' },
      { url: 'https://github.com/honojs/hono', title: 'GitHub', snippet: 'Repo' },
      { url: 'https://blog.example.com/hono', title: 'Blog', snippet: 'Blog post' },
    ]);

    const discoverer = new Discoverer(engine);
    const results = await discoverer.discover('hono', 4);

    // Should deduplicate hono.dev (keep highest scored)
    const honoDev = results.filter((r) => r.url.includes('hono.dev'));
    expect(honoDev).toHaveLength(1);
  });

  it('should filter out skip domains', async () => {
    const engine = createMockSearchEngine([
      { url: 'https://stackoverflow.com/q/123', title: 'SO', snippet: 'Q' },
      { url: 'https://medium.com/article', title: 'Medium', snippet: 'Post' },
      { url: 'https://docs.example.com/api', title: 'Docs', snippet: 'API' },
    ]);

    const discoverer = new Discoverer(engine);
    const results = await discoverer.discover('test');

    expect(results).toHaveLength(1);
    expect(results[0].url).toContain('example.com');
  });

  it('should respect maxResults', async () => {
    const engine = createMockSearchEngine([
      { url: 'https://a.com/docs', title: 'A', snippet: '' },
      { url: 'https://b.com/docs', title: 'B', snippet: '' },
      { url: 'https://c.com/docs', title: 'C', snippet: '' },
    ]);

    const discoverer = new Discoverer(engine);
    const results = await discoverer.discover('test', 2);

    expect(results).toHaveLength(2);
  });

  it('should return empty array when no results match', async () => {
    const engine = createMockSearchEngine([
      { url: 'https://stackoverflow.com/q/1', title: 'SO', snippet: '' },
      { url: 'https://reddit.com/r/test', title: 'Reddit', snippet: '' },
    ]);

    const discoverer = new Discoverer(engine);
    const results = await discoverer.discover('test');

    expect(results).toHaveLength(0);
  });
});
