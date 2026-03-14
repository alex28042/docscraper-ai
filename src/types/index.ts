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
} from './branded';

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
} from './branded';

export type {
  ScraperConfig,
  CrawlOptions,
  PageContent,
  CrawlResult,
  CrawlStats,
  TreeNode,
} from './domain';
