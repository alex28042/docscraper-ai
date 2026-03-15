// Branded types
export type {
  Url,
  Slug,
  Milliseconds,
  RequestsPerSecond,
  ConcurrencyLevel,
  CrawlDepth,
  MaxPages,
  RegexPattern,
  HtmlContent,
  MarkdownContent,
  UserAgent,
  PageTitle,
  MetaDescription,
  FilePath,
  DirectoryPath,
} from './types';

// Brand constructors
export {
  toUrl,
  toSlug,
  toMilliseconds,
  toRequestsPerSecond,
  toConcurrencyLevel,
  toCrawlDepth,
  toMaxPages,
  toRegexPattern,
  toHtmlContent,
  toMarkdownContent,
  toUserAgent,
  toPageTitle,
  toMetaDescription,
  toFilePath,
  toDirectoryPath,
} from './types';

// Domain types
export type {
  ScraperConfig,
  CrawlOptions,
  PageContent,
  CrawlResult,
  CrawlStats,
  TreeNode,
} from './types';

// Schemas (Zod runtime validation)
export {
  UrlSchema,
  SlugSchema,
  MillisecondsSchema,
  RequestsPerSecondSchema,
  ConcurrencyLevelSchema,
  CrawlDepthSchema,
  MaxPagesSchema,
  RegexPatternSchema,
  HtmlContentSchema,
  MarkdownContentSchema,
  UserAgentSchema,
  PageTitleSchema,
  MetaDescriptionSchema,
  FilePathSchema,
  DirectoryPathSchema,
  ScraperConfigSchema,
  CrawlOptionsSchema,
  PageContentSchema,
  CrawlStatsSchema,
  CrawlErrorSchema,
  CrawlResultSchema,
  TreeNodeSchema,
} from './schemas';

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
  ISitemapParser,
  IRobotsParser,
  ICodeExtractor,
  CodeSnippet,
  ICrawlProgress,
  CrawlProgressEvent,
  ICache,
} from './interfaces';
export { NullLogger, StderrLogger, NullProgress } from './interfaces';

// HTTP clients
export { RetryHttpClient } from './http/retry-http-client';
export type { RetryOptions } from './http/retry-http-client';
export { FetchHttpClient } from './http/fetch-http-client';
export { AxiosHttpClient } from './http/axios-http-client';
export { UndiciHttpClient } from './http/undici-http-client';
export { CachedHttpClient } from './http/cached-http-client';
export { InMemoryCache } from './http/in-memory-cache';
export type { InMemoryCacheOptions } from './http/in-memory-cache';
export { FsCache } from './http/fs-cache';
export type { FsCacheOptions } from './http/fs-cache';

// Core classes (public API — preserving WebScraper alias)
export { Crawler as WebScraper } from './crawling/crawler';
export { Crawler } from './crawling/crawler';
export { Discoverer } from './discovery/discoverer';
export { SitemapParser } from './discovery/sitemap-parser';
export { RobotsParser } from './discovery/robots-parser';

// Pure functions
export { buildTree } from './generation/tree-builder';
export { generateSkillTree } from './generation/generator';
export { exportToSingleFile, exportToSingleFileAndWrite } from './generation/single-file-exporter';
export type { SingleFileExportOptions } from './generation/single-file-exporter';

// Parsing implementations
export { CheerioCodeExtractor } from './parsing/code-extractor';

// Factories
export { createDefaultCrawler, createDefaultDiscoverer } from './factories';
export type { HttpClientType, CreateCrawlerOptions } from './factories';
