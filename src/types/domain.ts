import type {
  Url,
  Slug,
  Milliseconds,
  RequestsPerSecond,
  ConcurrencyLevel,
  CrawlDepth,
  MaxPages,
  RegexPattern,
  MarkdownContent,
  PageTitle,
  MetaDescription,
} from './branded';

export interface ScraperConfig {
  /** Max requests per second */
  rateLimit?: RequestsPerSecond;
  /** Request timeout in milliseconds */
  timeoutMs?: Milliseconds;
  /** Custom User-Agent string */
  userAgent?: string;
  /** Custom headers for requests */
  headers?: Record<string, string>;
  /** Max concurrent requests (default: 3) */
  concurrency?: ConcurrencyLevel;
}

export interface CrawlOptions {
  /** Maximum link depth from start URL (default: 2) */
  maxDepth?: CrawlDepth;
  /** Maximum number of pages to crawl (default: 50) */
  maxPages?: MaxPages;
  /** URL patterns to include (regex strings) */
  includePatterns?: RegexPattern[];
  /** URL patterns to exclude (regex strings) */
  excludePatterns?: RegexPattern[];
}

export interface PageContent {
  /** The page URL */
  url: Url;
  /** Page title from <title> or first <h1> */
  title: PageTitle;
  /** Meta description if available */
  description: MetaDescription;
  /** Converted Markdown content */
  markdown: MarkdownContent;
  /** Links found on the page */
  links: Url[];
  /** When the page was fetched */
  fetchedAt: Date;
}

export interface CrawlResult {
  /** The starting URL */
  startUrl: Url;
  /** All successfully crawled pages */
  pages: PageContent[];
  /** URLs that failed with error messages */
  errors: { url: Url; error: string }[];
  /** Crawl statistics */
  stats: CrawlStats;
}

export interface CrawlStats {
  totalPages: number;
  totalErrors: number;
  durationMs: Milliseconds;
  startedAt: Date;
  completedAt: Date;
}

export interface TreeNode {
  /** Slug used for the filename */
  slug: Slug;
  /** Display title */
  title: PageTitle;
  /** Source URL */
  url: Url;
  /** Markdown content */
  markdown: MarkdownContent;
  /** Child nodes */
  children: TreeNode[];
  /** Parent slug (empty for root-level) */
  parentSlug: Slug;
}
