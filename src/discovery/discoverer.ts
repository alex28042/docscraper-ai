import type { ISearchEngine, SearchResult } from '../interfaces/search-engine';
import { scoreResults, filterSkipDomains, deduplicateByDomain } from './scoring';

export class Discoverer {
  constructor(private readonly searchEngine: ISearchEngine) {}

  async discover(topic: string, maxResults = 4): Promise<SearchResult[]> {
    const query = `${topic} official documentation API reference`;
    const results = await this.searchEngine.search(query);
    const filtered = filterSkipDomains(results);
    const scored = scoreResults(filtered);
    return deduplicateByDomain(scored, maxResults);
  }
}
