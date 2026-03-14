import type { CrawlOptions, PageContent, CrawlResult, CrawlStats, Url } from '../types';
import { toUrl, toPageTitle, toMetaDescription, toMarkdownContent, toMilliseconds } from '../types';
import type { IHttpClient } from '../interfaces/http-client';
import type { IConcurrencyLimiter } from '../interfaces/concurrency-limiter';
import type { IHtmlParser } from '../interfaces/html-parser';
import type { IHtmlConverter } from '../interfaces/html-converter';
import type { ILinkExtractor } from '../interfaces/link-extractor';
import type { ILogger } from '../interfaces/logger';
import { NullLogger } from '../interfaces/logger';
import type { ICrawlProgress } from '../interfaces/progress';
import { NullProgress } from '../interfaces/progress';
import { filterLinks } from '../parsing/link-extractor';

export class Crawler {
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly concurrencyLimiter: IConcurrencyLimiter,
    private readonly parser: IHtmlParser,
    private readonly converter: IHtmlConverter,
    private readonly linkExtractor: ILinkExtractor,
    private readonly logger: ILogger = new NullLogger(),
    private readonly progress: ICrawlProgress = new NullProgress(),
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
      url: toUrl(url),
      title: toPageTitle(parsed.title),
      description: toMetaDescription(parsed.description),
      markdown: toMarkdownContent(markdown),
      links: links.map(toUrl),
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
    const errors: { url: Url; error: string }[] = [];
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
          errors.push({ url: toUrl(result.url), error: result.error });
          this.logger.error(`[error] ${result.url}: ${result.error}`);
          this.progress.onPageComplete({
            currentPage: pages.length + errors.length,
            totalPages: maxPages,
            url: result.url,
            status: 'error',
            error: result.error,
          });
          continue;
        }

        try {
          const page = this.processHtml(result.url, result.html!);
          pages.push(page);

          this.progress.onPageComplete({
            currentPage: pages.length + errors.length,
            totalPages: maxPages,
            url: result.url,
            status: 'success',
          });

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
          errors.push({ url: toUrl(result.url), error: message });
          this.logger.error(`[error] ${result.url}: ${message}`);
          this.progress.onPageComplete({
            currentPage: pages.length + errors.length,
            totalPages: maxPages,
            url: result.url,
            status: 'error',
            error: message,
          });
        }
      }
    }

    const completedAt = new Date();
    const stats: CrawlStats = {
      totalPages: pages.length,
      totalErrors: errors.length,
      durationMs: toMilliseconds(completedAt.getTime() - startedAt.getTime()),
      startedAt,
      completedAt,
    };

    this.progress.onCrawlComplete(stats);

    return { startUrl: toUrl(startUrl), pages, errors, stats };
  }
}
