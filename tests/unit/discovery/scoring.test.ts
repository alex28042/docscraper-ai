import { describe, it, expect } from 'vitest';
import {
  scoreResults,
  filterSkipDomains,
  deduplicateByDomain,
} from '../../../src/discovery/scoring';

describe('scoreResults', () => {
  it('should boost docs subdomain URLs', () => {
    const results = [
      { url: 'https://docs.example.com/api', title: 'Docs', snippet: '' },
      { url: 'https://example.com/page', title: 'Page', snippet: '' },
    ];
    const scored = scoreResults(results);
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
  });

  it('should boost /docs/ path', () => {
    const scored = scoreResults([
      { url: 'https://example.com/docs/intro', title: 'Docs', snippet: '' },
    ]);
    expect(scored[0].score).toBeGreaterThan(0);
  });

  it('should boost /api/ path', () => {
    const scored = scoreResults([{ url: 'https://example.com/api/v1', title: 'API', snippet: '' }]);
    expect(scored[0].score).toBeGreaterThan(0);
  });

  it('should boost GitHub repo root URLs', () => {
    const scored = scoreResults([
      { url: 'https://github.com/user/repo', title: 'Repo', snippet: '' },
    ]);
    expect(scored[0].score).toBeGreaterThan(0);
  });

  it('should give 0 score to unrecognized URLs', () => {
    const scored = scoreResults([{ url: 'https://random.com/page', title: 'Random', snippet: '' }]);
    expect(scored[0].score).toBe(0);
  });
});

describe('filterSkipDomains', () => {
  it('should filter out medium.com', () => {
    const results = [
      { url: 'https://medium.com/article', title: 'Medium', snippet: '' },
      { url: 'https://docs.example.com', title: 'Docs', snippet: '' },
    ];
    const filtered = filterSkipDomains(results);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].url).toContain('example.com');
  });

  it('should filter out stackoverflow', () => {
    const results = [{ url: 'https://stackoverflow.com/q/123', title: 'SO', snippet: '' }];
    expect(filterSkipDomains(results)).toHaveLength(0);
  });

  it('should keep non-skip domains', () => {
    const results = [{ url: 'https://hono.dev/docs', title: 'Hono', snippet: '' }];
    expect(filterSkipDomains(results)).toHaveLength(1);
  });
});

describe('deduplicateByDomain', () => {
  it('should keep only one result per domain', () => {
    const scored = [
      { url: 'https://docs.example.com/a', title: 'A', snippet: '', score: 5 },
      { url: 'https://docs.example.com/b', title: 'B', snippet: '', score: 3 },
      { url: 'https://other.com/c', title: 'C', snippet: '', score: 4 },
    ];
    const deduped = deduplicateByDomain(scored, 10);
    expect(deduped).toHaveLength(2);
  });

  it('should prefer higher-scored entries', () => {
    const scored = [
      { url: 'https://example.com/low', title: 'Low', snippet: '', score: 1 },
      { url: 'https://example.com/high', title: 'High', snippet: '', score: 10 },
    ];
    const deduped = deduplicateByDomain(scored, 10);
    expect(deduped[0].url).toContain('/high');
  });

  it('should respect maxResults limit', () => {
    const scored = [
      { url: 'https://a.com', title: 'A', snippet: '', score: 3 },
      { url: 'https://b.com', title: 'B', snippet: '', score: 2 },
      { url: 'https://c.com', title: 'C', snippet: '', score: 1 },
    ];
    const deduped = deduplicateByDomain(scored, 2);
    expect(deduped).toHaveLength(2);
  });
});
