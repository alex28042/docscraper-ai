import { TokenBucketRateLimiter } from '../http/rate-limiter';
import { DuckDuckGoSearchEngine } from '../discovery/duckduckgo-engine';
import { Discoverer } from '../discovery/discoverer';
import { HttpClientFactory } from './http-client-factory';
import type { HttpClientType } from './http-client-factory';

export class DiscovererFactory {
  private readonly httpClientType: HttpClientType;

  constructor(httpClientType: HttpClientType = 'fetch') {
    this.httpClientType = httpClientType;
  }

  async create(): Promise<Discoverer> {
    const rateLimiter = new TokenBucketRateLimiter(2);

    const httpClientFactory = new HttpClientFactory(this.httpClientType, {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timeoutMs: 15_000,
    });

    const httpClient = await httpClientFactory.create(rateLimiter);
    const searchEngine = new DuckDuckGoSearchEngine(httpClient);
    return new Discoverer(searchEngine);
  }
}
