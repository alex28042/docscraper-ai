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
});

export const PageContentSchema = z.object({
  url: UrlSchema,
  title: PageTitleSchema,
  description: MetaDescriptionSchema,
  markdown: MarkdownContentSchema,
  links: z.array(UrlSchema),
  fetchedAt: z.date(),
});

export const CrawlStatsSchema = z.object({
  totalPages: z.number().int().nonnegative(),
  totalErrors: z.number().int().nonnegative(),
  durationMs: MillisecondsSchema,
  startedAt: z.date(),
  completedAt: z.date(),
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
