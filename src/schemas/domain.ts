import { z } from 'zod';
import {
  UrlSchema,
  SlugSchema,
  MillisecondsSchema,
  RequestsPerSecondSchema,
  ConcurrencyLevelSchema,
  CrawlDepthSchema,
  MaxPagesSchema,
  RegexPatternSchema,
  MarkdownContentSchema,
  PageTitleSchema,
  MetaDescriptionSchema,
} from './branded';

export const ScraperConfigSchema = z.object({
  rateLimit: RequestsPerSecondSchema.optional(),
  timeoutMs: MillisecondsSchema.optional(),
  userAgent: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  concurrency: ConcurrencyLevelSchema.optional(),
});

export const CrawlOptionsSchema = z.object({
  maxDepth: CrawlDepthSchema.optional(),
  maxPages: MaxPagesSchema.optional(),
  includePatterns: z.array(RegexPatternSchema).optional(),
  excludePatterns: z.array(RegexPatternSchema).optional(),
  deduplication: z.boolean().optional(),
  deduplicationThreshold: z.number().int().nonnegative().optional(),
  languages: z.array(z.string()).optional(),
});

export const PageMetadataSchema = z.object({
  lastModified: z.string().optional(),
  author: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  language: z.string().optional(),
  version: z.string().optional(),
  deprecated: z.boolean(),
  deprecationMessage: z.string().optional(),
});

export const PageContentSchema = z.object({
  url: UrlSchema,
  title: PageTitleSchema,
  description: MetaDescriptionSchema,
  markdown: MarkdownContentSchema,
  links: z.array(UrlSchema),
  fetchedAt: z.date(),
  metadata: PageMetadataSchema.optional(),
  language: z.string().optional(),
});

export const CrawlStatsSchema = z.object({
  totalPages: z.number().int().nonnegative(),
  totalErrors: z.number().int().nonnegative(),
  durationMs: MillisecondsSchema,
  startedAt: z.date(),
  completedAt: z.date(),
  duplicatesSkipped: z.number().int().nonnegative().default(0),
});

export const CrawlErrorSchema = z.object({
  url: UrlSchema,
  error: z.string(),
});

export const CrawlResultSchema = z.object({
  startUrl: UrlSchema,
  pages: z.array(PageContentSchema),
  errors: z.array(CrawlErrorSchema),
  stats: CrawlStatsSchema,
});

export const TreeNodeSchema: z.ZodType = z.lazy(() =>
  z.object({
    slug: SlugSchema,
    title: PageTitleSchema,
    url: UrlSchema,
    markdown: MarkdownContentSchema,
    children: z.array(TreeNodeSchema),
    parentSlug: z.string(),
  }),
);

// Feature 3: Structured JSON Export
export const HeadingNodeSchema: z.ZodType = z.lazy(() =>
  z.object({
    level: z.number().int().min(1).max(6),
    text: z.string(),
    children: z.array(HeadingNodeSchema),
  }),
);

export const StructuredPageSchema = z.object({
  url: z.string(),
  title: z.string(),
  description: z.string(),
  headings: z.array(HeadingNodeSchema),
  codeBlocks: z.array(z.string()),
  metadata: PageMetadataSchema.optional(),
  markdown: z.string(),
});

export const StructuredExportSchema = z.object({
  startUrl: z.string(),
  pages: z.array(StructuredPageSchema),
  stats: CrawlStatsSchema,
  exportedAt: z.date(),
});

// Feature 4: Resumable Crawls
export const CrawlStateSchema = z.object({
  visited: z.array(z.string()),
  queue: z.array(z.tuple([z.string(), z.number()])),
  pages: z.array(PageContentSchema),
  errors: z.array(CrawlErrorSchema),
  startedAt: z.date(),
  startUrl: z.string(),
});

// Feature 5: API Metadata Detection
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

export const ApiParamSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
});

export const ApiEndpointSchema = z.object({
  method: HttpMethodSchema,
  path: z.string(),
  params: z.array(ApiParamSchema),
  returnType: z.string().optional(),
  description: z.string().optional(),
  codeExample: z.string().optional(),
});

// Feature 7: Link Validation
export const LinkStatusSchema = z.object({
  url: z.string(),
  statusCode: z.number().optional(),
  isExternal: z.boolean(),
  referencedFrom: z.array(z.string()),
  isValid: z.boolean(),
  error: z.string().optional(),
});

export const LinkReportSchema = z.object({
  total: z.number().int().nonnegative(),
  valid: z.number().int().nonnegative(),
  broken: z.number().int().nonnegative(),
  links: z.array(LinkStatusSchema),
});

// Feature 9: Diff Mode
export const PageDiffSchema = z.object({
  url: z.string(),
  changeType: z.enum(['added', 'removed', 'modified', 'unchanged']),
  previousTitle: z.string().optional(),
  currentTitle: z.string().optional(),
  contentChanged: z.boolean(),
});

export const CrawlDiffSchema = z.object({
  added: z.array(PageDiffSchema),
  removed: z.array(PageDiffSchema),
  modified: z.array(PageDiffSchema),
  unchanged: z.array(PageDiffSchema),
  summary: z.object({
    added: z.number().int().nonnegative(),
    removed: z.number().int().nonnegative(),
    modified: z.number().int().nonnegative(),
    unchanged: z.number().int().nonnegative(),
  }),
});
