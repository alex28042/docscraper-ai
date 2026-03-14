// Domain types
export {
  ScraperConfig,
  CrawlOptions,
  PageContent,
  CrawlResult,
  CrawlStats,
  TreeNode,
} from './types';

// Interfaces
export type {
  IHttpClient,
  IRateLimiter,
  IConcurrencyLimiter,
  IHtmlParser,
  ParsedPage,
  IHtmlConverter,
  ILinkExtractor,
  ISearchEngine,
  SearchResult,
  IContentWriter,
  ILogger,
} from './interfaces';
export { NullLogger, StderrLogger } from './interfaces';

// HTTP clients
export { FetchHttpClient } from './http/fetch-http-client';
export { AxiosHttpClient } from './http/axios-http-client';
export { UndiciHttpClient } from './http/undici-http-client';

// Core classes (public API — preserving WebScraper alias)
export { Crawler as WebScraper } from './crawling/crawler';
export { Crawler } from './crawling/crawler';
export { Discoverer } from './discovery/discoverer';

// Pure functions
export { buildTree } from './generation/tree-builder';
export { generateSkillTree } from './generation/generator';

// Factories
export { createDefaultCrawler, createDefaultDiscoverer } from './factories';
export type { HttpClientType, CreateCrawlerOptions } from './factories';
