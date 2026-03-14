export interface ScraperConfig {
  /** Max requests per second */
  rateLimit?: number;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Custom User-Agent string */
  userAgent?: string;
  /** Custom headers for requests */
  headers?: Record<string, string>;
  /** Max concurrent requests (default: 3) */
  concurrency?: number;
}

export interface CrawlOptions {
  /** Maximum link depth from start URL (default: 2) */
  maxDepth?: number;
  /** Maximum number of pages to crawl (default: 50) */
  maxPages?: number;
  /** URL patterns to include (regex strings) */
  includePatterns?: string[];
  /** URL patterns to exclude (regex strings) */
  excludePatterns?: string[];
}

export interface PageContent {
  /** The page URL */
  url: string;
  /** Page title from <title> or first <h1> */
  title: string;
  /** Meta description if available */
  description: string;
  /** Converted Markdown content */
  markdown: string;
  /** Links found on the page */
  links: string[];
  /** When the page was fetched */
  fetchedAt: Date;
}

export interface CrawlResult {
  /** The starting URL */
  startUrl: string;
  /** All successfully crawled pages */
  pages: PageContent[];
  /** URLs that failed with error messages */
  errors: { url: string; error: string }[];
  /** Crawl statistics */
  stats: CrawlStats;
}

export interface CrawlStats {
  totalPages: number;
  totalErrors: number;
  durationMs: number;
  startedAt: Date;
  completedAt: Date;
}

export interface TreeNode {
  /** Slug used for the filename */
  slug: string;
  /** Display title */
  title: string;
  /** Source URL */
  url: string;
  /** Markdown content */
  markdown: string;
  /** Child nodes */
  children: TreeNode[];
  /** Parent slug (empty for root-level) */
  parentSlug: string;
}
