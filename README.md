# docscraper-ai

Fast documentation scraper and HTML-to-Markdown converter built for AI agents. Discover, crawl, and extract docs into clean structured Markdown.

[![npm version](https://img.shields.io/npm/v/docscraper-ai)](https://www.npmjs.com/package/docscraper-ai)
[![CI](https://github.com/Alex28042/docscraper-ai/actions/workflows/release.yml/badge.svg)](https://github.com/Alex28042/docscraper-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Claude Code Skill — `/skill-tree`

Generate structured knowledge graphs from any documentation, directly in Claude Code.

**Install the skill with one command:**

```bash
curl -fsSL https://raw.githubusercontent.com/Alex28042/docscraper-ai/main/skills/skill-tree.md -o ~/.claude/commands/skill-tree.md
```

**Use it:**

```
/skill-tree hono-routing
/skill-tree supabase-auth
/skill-tree https://docs.stripe.com/webhooks
/skill-tree stripe-webhooks --global
```

**What it does:**
1. Discovers official documentation sources
2. Scrapes and converts to Markdown
3. Builds an atomic concept graph (8-20 nodes)
4. Generates interlinked `.md` files with `[[wikilinks]]`
5. Saves to `.claude/skills/<topic>/` (or `~/.claude/skills/` with `--global`)

## Features

- **Discover** official documentation sources via DuckDuckGo search
- **Crawl** multi-page sites with BFS, depth control, and concurrency
- **Convert** HTML to clean Markdown (Turndown + Cheerio)
- **Sitemap parsing** for efficient URL discovery via `sitemap.xml`
- **Robots.txt** compliance with User-Agent matching and crawl delay
- **Retry with backoff** — exponential backoff + jitter on failures
- **Progress events** — real-time callbacks for page-by-page tracking
- **Code snippet extraction** — pull code blocks with language detection
- **Single-file export** — concatenate all pages into one Markdown file
- **3 HTTP clients** — native fetch, Axios, or Undici (fastest)
- **Branded types** + **Zod schemas** for type-safe runtime validation
- **SOLID architecture** with full dependency injection

## Install

```bash
npm install docscraper-ai
# or
pnpm add docscraper-ai
```

## CLI

### Discover documentation sources

```bash
npx docscraper-ai discover "hono framework"
```

```json
[
  { "url": "https://hono.dev/docs/", "title": "Hono - Web framework", "snippet": "..." },
  { "url": "https://github.com/honojs/hono", "title": "GitHub - honojs/hono", "snippet": "..." }
]
```

### Scrape URLs to Markdown

```bash
# Output as JSON to stdout
npx docscraper-ai scrape https://hono.dev/docs/

# Save as .md files to a directory
npx docscraper-ai scrape https://hono.dev/docs/ --output ./raw

# Multiple URLs with concurrency
npx docscraper-ai scrape https://hono.dev/docs https://hono.dev/api --output ./raw --concurrency 5
```

### CLI Options

```
Commands:
  discover <topic>              Search for official documentation URLs
  scrape <url> [<url>...]       Scrape URLs and output markdown

Discover options:
  --max-results <n>             Max URLs to return (default: 4)

Scrape options:
  --output <dir>                Output directory for .md files (default: stdout as JSON)
  --max-chars <n>               Skip pages over N characters (default: 80000)
  --concurrency <n>             Max concurrent requests (default: 3)
```

## Programmatic API

### Quick Start

```typescript
import { createDefaultCrawler, createDefaultDiscoverer } from 'docscraper-ai';

// Discover documentation sources
const discoverer = await createDefaultDiscoverer();
const sources = await discoverer.discover('supabase auth');
console.log(sources);

// Crawl a documentation site
const crawler = await createDefaultCrawler();
const result = await crawler.crawl('https://hono.dev/docs/', {
  maxDepth: 2,
  maxPages: 20,
});

for (const page of result.pages) {
  console.log(`${page.title}: ${page.markdown.length} chars`);
}
```

### Scrape a Single Page

```typescript
const crawler = await createDefaultCrawler();
const page = await crawler.scrapePage('https://hono.dev/docs/getting-started');

console.log(page.title);       // "Getting Started - Hono"
console.log(page.markdown);    // Clean markdown content
console.log(page.links);       // ["https://hono.dev/docs/api", ...]
```

### Choose Your HTTP Client

Three built-in HTTP clients — pick the one that fits your needs:

```typescript
import { createDefaultCrawler } from 'docscraper-ai';

// Native fetch (default, zero deps)
const fetchCrawler = await createDefaultCrawler({ httpClient: 'fetch' });

// Axios (feature-rich)
const axiosCrawler = await createDefaultCrawler({ httpClient: 'axios' });

// Undici (fastest for high-throughput)
const undiciCrawler = await createDefaultCrawler({ httpClient: 'undici' });
```

### Retry with Exponential Backoff

Wrap any HTTP client with automatic retries on network errors and 5xx responses:

```typescript
import { RetryHttpClient, FetchHttpClient } from 'docscraper-ai';
import { TokenBucketRateLimiter } from 'docscraper-ai/dist/http/rate-limiter';

const inner = new FetchHttpClient(new TokenBucketRateLimiter(5));

const resilientClient = new RetryHttpClient(inner, {
  maxRetries: 3,        // retry up to 3 times
  baseDelayMs: 1000,    // start with 1s delay
  maxDelayMs: 10_000,   // cap at 10s
});
// Delay formula: min(baseDelay * 2^attempt, maxDelay) + random jitter
```

### Progress Events

Track crawling progress in real-time:

```typescript
import { createDefaultCrawler, type ICrawlProgress, type CrawlProgressEvent, type CrawlStats } from 'docscraper-ai';

const progress: ICrawlProgress = {
  onPageComplete(event: CrawlProgressEvent) {
    const icon = event.status === 'success' ? 'ok' : 'ERR';
    console.log(`[${event.currentPage}/${event.totalPages}] ${icon} ${event.url}`);
  },
  onCrawlComplete(stats: CrawlStats) {
    console.log(`Done: ${stats.totalPages} pages in ${stats.durationMs}ms`);
  },
};

const crawler = await createDefaultCrawler();
// Pass progress as the constructor's last argument when using Crawler directly:
import { Crawler, NullLogger } from 'docscraper-ai';
// new Crawler(httpClient, concurrencyLimiter, parser, converter, linkExtractor, logger, progress);
```

### Sitemap Parsing

Discover all pages from a site's sitemap.xml:

```typescript
import { SitemapParser, FetchHttpClient } from 'docscraper-ai';
import { TokenBucketRateLimiter } from 'docscraper-ai/dist/http/rate-limiter';

const httpClient = new FetchHttpClient(new TokenBucketRateLimiter(5));
const sitemap = new SitemapParser(httpClient);

const urls = await sitemap.parse('https://hono.dev/sitemap.xml');
console.log(`Found ${urls.length} pages`);
// ["https://hono.dev/docs/", "https://hono.dev/docs/api", ...]
```

### Robots.txt Compliance

Respect crawling rules like a professional scraper:

```typescript
import { RobotsParser, FetchHttpClient } from 'docscraper-ai';
import { TokenBucketRateLimiter } from 'docscraper-ai/dist/http/rate-limiter';

const httpClient = new FetchHttpClient(new TokenBucketRateLimiter(5));
const robots = new RobotsParser(httpClient);

// Check if a URL is allowed
const allowed = await robots.isAllowed('https://example.com/docs/api');

// Get crawl delay (seconds)
const delay = robots.getCrawlDelay(); // e.g. 2

// Discover sitemaps from robots.txt
const sitemaps = robots.getSitemapUrls(); // ["https://example.com/sitemap.xml"]
```

### Code Snippet Extraction

Extract code blocks from HTML with language detection:

```typescript
import { CheerioCodeExtractor } from 'docscraper-ai';

const extractor = new CheerioCodeExtractor();
const snippets = extractor.extract(html);

for (const snippet of snippets) {
  console.log(`Language: ${snippet.language}`);  // "typescript", "bash", etc.
  console.log(`Context: ${snippet.context}`);    // nearest heading
  console.log(`Code: ${snippet.code}`);
}
```

### Single-File Export

Concatenate all crawled pages into one Markdown file:

```typescript
import { createDefaultCrawler, exportToSingleFile } from 'docscraper-ai';

const crawler = await createDefaultCrawler();
const result = await crawler.crawl('https://hono.dev/docs/', { maxPages: 20 });

// As a string
const markdown = exportToSingleFile(result, {
  includeMetadata: true,  // adds crawl stats header
  separator: '\n\n---\n\n',
});

// Write to file
import { exportToSingleFileAndWrite } from 'docscraper-ai';
import { FsContentWriter } from 'docscraper-ai/dist/generation/fs-writer';

exportToSingleFileAndWrite(result, './docs-all.md', new FsContentWriter());
```

### Generate a Skill Tree

Build a hierarchical documentation tree with navigation:

```typescript
import { createDefaultCrawler, generateSkillTree } from 'docscraper-ai';
import { FsContentWriter } from 'docscraper-ai/dist/generation/fs-writer';

const crawler = await createDefaultCrawler();
const result = await crawler.crawl('https://hono.dev/docs/', {
  maxDepth: 2,
  maxPages: 30,
});

const writer = new FsContentWriter();
const { files, indexPath } = generateSkillTree(result, './output', writer);

console.log(`Generated ${files.length} files`);
console.log(`Index: ${indexPath}`);
```

### Custom Configuration

```typescript
import { createDefaultCrawler, StderrLogger } from 'docscraper-ai';

const crawler = await createDefaultCrawler(
  {
    rateLimit: 10,        // requests per second
    timeoutMs: 15_000,    // 15 second timeout
    concurrency: 5,       // 5 concurrent requests
    httpClient: 'undici',
  },
  new StderrLogger(),
);

const result = await crawler.crawl('https://docs.stripe.com/api', {
  maxDepth: 3,
  maxPages: 100,
  includePatterns: ['/api/'],
  excludePatterns: ['/changelog'],
});
```

### Dependency Injection

All core classes accept interfaces via constructor — swap any component:

```typescript
import {
  Crawler,
  type IHttpClient,
  type IHtmlParser,
  type IHtmlConverter,
  type ILinkExtractor,
  NullLogger,
  NullProgress,
} from 'docscraper-ai';
import { SemaphoreConcurrencyLimiter } from 'docscraper-ai/dist/http/concurrency-limiter';

const myClient: IHttpClient = {
  async fetch(url) {
    const res = await fetch(url);
    return res.text();
  },
};

const crawler = new Crawler(
  myClient,
  new SemaphoreConcurrencyLimiter(3),
  myParser,         // IHtmlParser
  myConverter,      // IHtmlConverter
  myLinkExtractor,  // ILinkExtractor
  new NullLogger(),
  new NullProgress(),
);
```

### Zod Schemas for Validation

Validate data at runtime boundaries:

```typescript
import { ScraperConfigSchema, CrawlOptionsSchema, UrlSchema } from 'docscraper-ai';

const config = ScraperConfigSchema.parse({
  rateLimit: 5,
  timeoutMs: 10_000,
  concurrency: 3,
});

const url = UrlSchema.parse('https://docs.example.com');
```

### Branded Types

Type-safe domain primitives — prevent mixing up strings and numbers:

```typescript
import type { Url, Milliseconds } from 'docscraper-ai';
import { toUrl, toMilliseconds } from 'docscraper-ai';

const url: Url = toUrl('https://docs.example.com');
const timeout: Milliseconds = toMilliseconds(10_000);

// TypeScript errors — can't assign raw primitives:
// const bad: Url = 'https://example.com';
// const wrong: Milliseconds = 5000;
```

## Architecture

```
src/
  interfaces/     # Pure interfaces (Strategy pattern)
  types/          # Branded types and domain types
  schemas/        # Zod runtime validation
  http/           # FetchHttpClient, AxiosHttpClient, UndiciHttpClient, RetryHttpClient
  parsing/        # CheerioHtmlParser, TurndownConverter, CheerioLinkExtractor, CheerioCodeExtractor
  discovery/      # Discoverer, DuckDuckGoSearchEngine, SitemapParser, RobotsParser, scoring
  crawling/       # Crawler with DI (7 injectable deps)
  generation/     # Skill tree, content generator, single-file exporter, file writer
  cli/            # CLI commands
  factories.ts    # createDefaultCrawler(), createDefaultDiscoverer()
```

SOLID principles with constructor dependency injection. No DI container — factory functions wire the dependency graph.

## License

MIT
