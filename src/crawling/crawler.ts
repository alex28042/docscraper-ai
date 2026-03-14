import type { CrawlOptions, PageContent, CrawlResult, CrawlStats } from '../types';
import type { IHttpClient } from '../interfaces/http-client';
import type { IConcurrencyLimiter } from '../interfaces/concurrency-limiter';
import type { IHtmlParser } from '../interfaces/html-parser';
import type { IHtmlConverter } from '../interfaces/html-converter';
import type { ILinkExtractor } from '../interfaces/link-extractor';
import type { ILogger } from '../interfaces/logger';
import { NullLogger } from '../interfaces/logger';
import { filterLinks } from '../parsing/link-extractor';

export class Crawler {
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly concurrencyLimiter: IConcurrencyLimiter,
    private readonly parser: IHtmlParser,
    private readonly converter: IHtmlConverter,
    private readonly linkExtractor: ILinkExtractor,
    private readonly logger: ILogger = new NullLogger(),
  ) {}

  async scrapePage(url: string): Promise<PageContent> {
    const html = await this.httpClient.fetch(url);
    return this.processHtml(url, html);
  }

  private processHtml(url: string, html: string): PageContent {
    const parsed = this.parser.parse(html, url);
    const markdown = this.converter.convert(parsed.mainHtml);
    const links = this.linkExtractor.extract(html, url);

    return {
      url,
      title: parsed.title,
      description: parsed.description,
      markdown,
      links,
      fetchedAt: new Date(),
    };
  }

  async crawl(startUrl: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const maxDepth = options.maxDepth ?? 2;
    const maxPages = options.maxPages ?? 50;
    const includePatterns = options.includePatterns ?? [];
    const excludePatterns = options.excludePatterns ?? [];

    const visited = new Set<string>();
    const pages: PageContent[] = [];
    const errors: { url: string; error: string }[] = [];
    const startedAt = new Date();

    const queue: [string, number][] = [[startUrl, 0]];
    visited.add(startUrl);

    while (queue.length > 0 && pages.length < maxPages) {
      const batchSize = Math.min(queue.length, maxPages - pages.length);
      const batch = queue.splice(0, batchSize);

      this.logger.info(
        `[${pages.length + 1}-${pages.length + batchSize}/${maxPages}] Crawling ${batchSize} pages concurrently`,
      );

      const results = await Promise.all(
        batch.map(([url]) =>
          this.concurrencyLimiter.run(async () => {
            try {
              const html = await this.httpClient.fetch(url);
              return { url, html, error: undefined };
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              return { url, html: undefined, error: message };
            }
          }),
        ),
      );

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const [, depth] = batch[i];

        if (result.error) {
          errors.push({ url: result.url, error: result.error });
          this.logger.error(`[error] ${result.url}: ${result.error}`);
          continue;
        }

        try {
          const page = this.processHtml(result.url, result.html!);
          pages.push(page);

          if (depth < maxDepth) {
            const childLinks = filterLinks(page.links, includePatterns, excludePatterns);

            for (const link of childLinks) {
              if (!visited.has(link) && pages.length + queue.length < maxPages) {
                visited.add(link);
                queue.push([link, depth + 1]);
              }
            }
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          errors.push({ url: result.url, error: message });
          this.logger.error(`[error] ${result.url}: ${message}`);
        }
      }
    }

    const completedAt = new Date();
    const stats: CrawlStats = {
      totalPages: pages.length,
      totalErrors: errors.length,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      startedAt,
      completedAt,
    };

    return { startUrl, pages, errors, stats };
  }
}
