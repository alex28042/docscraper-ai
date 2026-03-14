# docscraper-ai

Fast documentation scraper and HTML-to-Markdown converter built for AI agents. Discover, crawl, and extract docs into clean structured Markdown.

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
const crawler = await createDefaultCrawler({ httpClient: 'fetch' });

// Axios (feature-rich)
const crawler = await createDefaultCrawler({ httpClient: 'axios' });

// Undici (fastest for high-throughput)
const crawler = await createDefaultCrawler({ httpClient: 'undici' });
```

### Custom Configuration

```typescript
import { createDefaultCrawler } from 'docscraper-ai';
import { StderrLogger } from 'docscraper-ai';

const crawler = await createDefaultCrawler(
  {
    rateLimit: 10,        // requests per second
    timeoutMs: 15_000,    // 15 second timeout
    concurrency: 5,       // 5 concurrent requests
    httpClient: 'undici',
  },
  new StderrLogger(),     // log progress to stderr
);

const result = await crawler.crawl('https://docs.stripe.com/api', {
  maxDepth: 3,
  maxPages: 100,
  includePatterns: ['/api/'],
  excludePatterns: ['/changelog'],
});
```

### Generate a Skill Tree

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
} from 'docscraper-ai';
import { SemaphoreConcurrencyLimiter } from 'docscraper-ai/dist/http/concurrency-limiter';

// Implement your own HTTP client
const myClient: IHttpClient = {
  async fetch(url) {
    const res = await fetch(url);
    return res.text();
  },
};

// Wire it up
const crawler = new Crawler(
  myClient,
  new SemaphoreConcurrencyLimiter(3),
  myParser,        // IHtmlParser
  myConverter,     // IHtmlConverter
  myLinkExtractor, // ILinkExtractor
  new NullLogger(),
);
```

### Zod Schemas for Validation

Validate data at runtime boundaries:

```typescript
import { ScraperConfigSchema, CrawlOptionsSchema, UrlSchema } from 'docscraper-ai';

// Validate user input
const config = ScraperConfigSchema.parse({
  rateLimit: 5,
  timeoutMs: 10_000,
  concurrency: 3,
});

// Validate a URL
const url = UrlSchema.parse('https://docs.example.com');
```

### Branded Types

Type-safe domain primitives — prevent mixing up strings and numbers:

```typescript
import type { Url, Milliseconds } from 'docscraper-ai';
import { toUrl, toMilliseconds } from 'docscraper-ai';

const url: Url = toUrl('https://docs.example.com');
const timeout: Milliseconds = toMilliseconds(10_000);

// TypeScript errors:
// const bad: Url = 'https://example.com';        // string is not Url
// const wrong: Milliseconds = 5000;               // number is not Milliseconds
```

## Architecture

```
src/
  interfaces/     # Pure interfaces (Strategy pattern)
  types/          # Branded types and domain types
  schemas/        # Zod runtime validation
  http/           # FetchHttpClient, AxiosHttpClient, UndiciHttpClient
  parsing/        # CheerioHtmlParser, TurndownConverter, CheerioLinkExtractor
  discovery/      # Discoverer, DuckDuckGoSearchEngine, scoring
  crawling/       # Crawler with 6 injected dependencies
  generation/     # Content generation, tree builder, file writer
  cli/            # CLI commands
  factories.ts    # createDefaultCrawler(), createDefaultDiscoverer()
```

SOLID principles with constructor dependency injection. No DI container — factory functions wire the dependency graph.

## License

MIT
