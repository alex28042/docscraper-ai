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
  /** Enable content deduplication via simhash (default: false) */
  deduplication?: boolean;
  /** Hamming distance threshold for deduplication (default: 3) */
  deduplicationThreshold?: number;
  /** Only crawl pages matching these language codes */
  languages?: string[];
  /** State store for resumable crawls */
  stateStore?: ICrawlStateStore;
}

// Feature 1: Metadata Extraction
export interface PageMetadata {
  lastModified?: string;
  author?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  language?: string;
  version?: string;
  deprecated: boolean;
  deprecationMessage?: string;
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
  /** Extracted page metadata */
  metadata?: PageMetadata;
  /** Detected language code */
  language?: string;
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
  /** Number of duplicate pages skipped */
  duplicatesSkipped: number;
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

// Feature 3: Structured JSON Export
export interface HeadingNode {
  level: number;
  text: string;
  children: HeadingNode[];
}

export interface StructuredPage {
  url: string;
  title: string;
  description: string;
  headings: HeadingNode[];
  codeBlocks: string[];
  metadata?: PageMetadata;
  markdown: string;
}

export interface StructuredExport {
  startUrl: string;
  pages: StructuredPage[];
  stats: CrawlStats;
  exportedAt: Date;
}

// Feature 4: Resumable Crawls
export interface CrawlState {
  visited: string[];
  queue: [string, number][];
  pages: PageContent[];
  errors: { url: Url; error: string }[];
  startedAt: Date;
  startUrl: string;
}

export interface ICrawlStateStore {
  load(): Promise<CrawlState | undefined>;
  save(state: CrawlState): Promise<void>;
  clear(): Promise<void>;
}

// Feature 5: API Metadata Detection
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  params: ApiParam[];
  returnType?: string;
  description?: string;
  codeExample?: string;
}

// Feature 7: Link Validation
export interface LinkStatus {
  url: string;
  statusCode?: number;
  isExternal: boolean;
  referencedFrom: string[];
  isValid: boolean;
  error?: string;
}

export interface LinkReport {
  total: number;
  valid: number;
  broken: number;
  links: LinkStatus[];
}

// Feature 9: Diff Mode
export interface PageDiff {
  url: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  previousTitle?: string;
  currentTitle?: string;
  contentChanged: boolean;
}

export interface CrawlDiff {
  added: PageDiff[];
  removed: PageDiff[];
  modified: PageDiff[];
  unchanged: PageDiff[];
  summary: { added: number; removed: number; modified: number; unchanged: number };
}
