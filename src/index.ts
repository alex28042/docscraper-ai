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
  PageMetadata,
  CrawlResult,
  CrawlStats,
  TreeNode,
  HeadingNode,
  StructuredPage,
  StructuredExport,
  CrawlState,
  ICrawlStateStore,
  HttpMethod,
  ApiParam,
  ApiEndpoint,
  LinkStatus,
  LinkReport,
  PageDiff,
  CrawlDiff,
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
  PageMetadataSchema,
  PageContentSchema,
  CrawlStatsSchema,
  CrawlErrorSchema,
  CrawlResultSchema,
  TreeNodeSchema,
  HeadingNodeSchema,
  StructuredPageSchema,
  StructuredExportSchema,
  CrawlStateSchema,
  HttpMethodSchema,
  ApiParamSchema,
  ApiEndpointSchema,
  LinkStatusSchema,
  LinkReportSchema,
  PageDiffSchema,
  CrawlDiffSchema,
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
  IMetadataExtractor,
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
export { PlaywrightHttpClient } from './http/playwright-http-client';
export type { PlaywrightOptions } from './http/playwright-http-client';

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

// Feature 1: Metadata extraction
export { CheerioMetadataExtractor } from './parsing/metadata-extractor';

// Feature 2: Content deduplication
export { tokenize, computeSimhash, hammingDistance, areSimilar } from './parsing/deduplication';

// Feature 3: Structured JSON export
export {
  extractHeadings,
  toStructuredPage,
  exportToStructuredJson,
} from './generation/structured-export';

// Feature 4: Resumable crawls
export { FsCrawlStateStore } from './crawling/fs-crawl-state';

// Feature 5: API metadata detection
export { extractApiEndpoints } from './parsing/api-extractor';

// Feature 6: Config file support
export { findConfigFile, loadConfig, mergeConfig } from './cli/config';
export type { CliConfig } from './cli/config';
export { CliConfigSchema } from './schemas/cli-config';

// Feature 7: Link validation
export { validateLinks } from './parsing/link-validator';
export type { LinkValidatorOptions } from './parsing/link-validator';

// Feature 8: Language detection
export { detectLanguageFromHtml } from './parsing/language-detector';

// Feature 9: Diff mode
export { diffCrawls, exportCrawlResult, importCrawlResult } from './generation/diff';

// Parsing implementations
export { CheerioCodeExtractor } from './parsing/code-extractor';

// Custom errors
export {
  DocScraperError,
  HttpFetchError,
  HtmlParseError,
  MissingDependencyError,
  ConfigValidationError,
  CrawlStateError,
  ConfigFileError,
  DiffInputError,
} from './errors';

// Factories
export { CrawlerFactory, DiscovererFactory } from './factories';
export { createDefaultCrawler, createDefaultDiscoverer } from './factories';
export type { HttpClientType, CreateCrawlerOptions } from './factories';
