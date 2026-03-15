import type { ILogger } from './interfaces/logger';
import type { Crawler } from './crawling/crawler';
import type { Discoverer } from './discovery/discoverer';
import { CrawlerFactory } from './factories/crawler-factory';
import { DiscovererFactory } from './factories/discoverer-factory';
import type { HttpClientType } from './factories/http-client-factory';
import type { CreateCrawlerOptions } from './factories/crawler-factory';

// Re-export factory classes and types
export { HttpClientFactory } from './factories/http-client-factory';
export type { HttpClientType, HttpClientOptions } from './factories/http-client-factory';
export { CrawlerFactory } from './factories/crawler-factory';
export type { CreateCrawlerOptions } from './factories/crawler-factory';
export { DiscovererFactory } from './factories/discoverer-factory';

// Backwards-compatible factory functions (public API)
export async function createDefaultCrawler(
  config: CreateCrawlerOptions = {},
  logger?: ILogger,
): Promise<Crawler> {
  return new CrawlerFactory(config, logger).create();
}

export async function createDefaultDiscoverer(
  httpClientType: HttpClientType = 'fetch',
): Promise<Discoverer> {
  return new DiscovererFactory(httpClientType).create();
}
