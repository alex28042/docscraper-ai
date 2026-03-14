import type { SearchResult } from '../interfaces';

const SKIP_DOMAINS = [
  'medium.com',
  'dev.to',
  'stackoverflow.com',
  'stackexchange.com',
  'reddit.com',
  'quora.com',
  'w3schools.com',
  'geeksforgeeks.org',
  'tutorialspoint.com',
  'youtube.com',
  'twitter.com',
  'x.com',
];

const OFFICIAL_SIGNALS = [
  { pattern: /docs?\./i, boost: 3 },
  { pattern: /developer\./i, boost: 3 },
  { pattern: /api\./i, boost: 2 },
  { pattern: /\/docs\//i, boost: 2 },
  { pattern: /\/api\//i, boost: 2 },
  { pattern: /\/reference\//i, boost: 2 },
  { pattern: /\/guide/i, boost: 1 },
  { pattern: /github\.com\/[^/]+\/[^/]+$/i, boost: 2 },
  { pattern: /github\.com\/[^/]+\/[^/]+\/(blob|tree)\/.*readme/i, boost: 1 },
];

export function scoreResults(results: SearchResult[]): (SearchResult & { score: number })[] {
  return results.map((r) => {
    let score = 0;
    for (const signal of OFFICIAL_SIGNALS) {
      if (signal.pattern.test(r.url)) {
        score += signal.boost;
      }
    }
    return { ...r, score };
  });
}

export function filterSkipDomains(results: SearchResult[]): SearchResult[] {
  return results.filter((r) => !SKIP_DOMAINS.some((d) => new URL(r.url).hostname.includes(d)));
}

export function deduplicateByDomain(
  scored: (SearchResult & { score: number })[],
  maxResults: number,
): SearchResult[] {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];

  for (const r of sorted) {
    const domain = new URL(r.url).hostname;
    if (!seen.has(domain)) {
      seen.add(domain);
      deduped.push({ url: r.url, title: r.title, snippet: r.snippet });
    }
    if (deduped.length >= maxResults) break;
  }

  return deduped;
}
