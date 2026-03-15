import type { CrawlResult, PageDiff, CrawlDiff } from '../types';
import { DiffInputError } from '../errors';

/** Compare two crawl results and produce a diff */
export function diffCrawls(previous: CrawlResult, current: CrawlResult): CrawlDiff {
  const prevMap = new Map(previous.pages.map((p) => [p.url, p]));
  const currMap = new Map(current.pages.map((p) => [p.url, p]));

  const added: PageDiff[] = [];
  const removed: PageDiff[] = [];
  const modified: PageDiff[] = [];
  const unchanged: PageDiff[] = [];

  // Check current pages against previous
  for (const [url, page] of currMap) {
    const prev = prevMap.get(url);
    if (!prev) {
      added.push({
        url,
        changeType: 'added',
        currentTitle: page.title,
        contentChanged: true,
      });
    } else if (prev.markdown !== page.markdown) {
      modified.push({
        url,
        changeType: 'modified',
        previousTitle: prev.title,
        currentTitle: page.title,
        contentChanged: true,
      });
    } else {
      unchanged.push({
        url,
        changeType: 'unchanged',
        previousTitle: prev.title,
        currentTitle: page.title,
        contentChanged: false,
      });
    }
  }

  // Check for removed pages
  for (const [url, page] of prevMap) {
    if (!currMap.has(url)) {
      removed.push({
        url,
        changeType: 'removed',
        previousTitle: page.title,
        contentChanged: true,
      });
    }
  }

  return {
    added,
    removed,
    modified,
    unchanged,
    summary: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      unchanged: unchanged.length,
    },
  };
}

/** Serialize a CrawlResult to JSON string */
export function exportCrawlResult(result: CrawlResult): string {
  return JSON.stringify(result, null, 2);
}

/** Deserialize a JSON string to CrawlResult */
export function importCrawlResult(json: string): CrawlResult {
  let parsed: CrawlResult;
  try {
    parsed = JSON.parse(json) as CrawlResult;
  } catch {
    throw new DiffInputError('Invalid JSON input for crawl result');
  }
  if (!parsed.pages || !parsed.stats) {
    throw new DiffInputError('Crawl result is missing required fields (pages, stats)');
  }
  // Restore Date objects
  parsed.stats.startedAt = new Date(parsed.stats.startedAt);
  parsed.stats.completedAt = new Date(parsed.stats.completedAt);
  for (const page of parsed.pages) {
    page.fetchedAt = new Date(page.fetchedAt);
  }
  return parsed;
}
