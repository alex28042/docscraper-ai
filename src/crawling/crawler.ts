import type { CrawlOptions, PageContent, CrawlResult, CrawlStats, CrawlState, Url } from '../types';
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
import type { IMetadataExtractor } from '../interfaces/metadata-extractor';
import { filterLinks } from '../parsing/link-extractor';
import { detectLanguageFromHtml } from '../parsing/language-detector';
import { computeSimhash, areSimilar } from '../parsing/deduplication';

export class Crawler {
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly concurrencyLimiter: IConcurrencyLimiter,
    private readonly parser: IHtmlParser,
    private readonly converter: IHtmlConverter,
    private readonly linkExtractor: ILinkExtractor,
    private readonly logger: ILogger = new NullLogger(),
    private readonly progress: ICrawlProgress = new NullProgress(),
    private readonly metadataExtractor?: IMetadataExtractor,
  ) {}

  async scrapePage(url: string): Promise<PageContent> {
    const html = await this.httpClient.fetch(url);
    return this.processHtml(url, html);
  }

  private processHtml(url: string, html: string): PageContent {
    const parsed = this.parser.parse(html, url);
    const markdown = this.converter.convert(parsed.mainHtml);
    const links = this.linkExtractor.extract(html, url);

    const page: PageContent = {
      url: toUrl(url),
      title: toPageTitle(parsed.title),
      description: toMetaDescription(parsed.description),
      markdown: toMarkdownContent(markdown),
      links: links.map(toUrl),
      fetchedAt: new Date(),
    };

    // Feature 1: Metadata extraction
    if (this.metadataExtractor) {
      page.metadata = this.metadataExtractor.extract(html, url);
    }

    // Feature 8: Language detection
    const language = detectLanguageFromHtml(html);
    if (language) {
      page.language = language;
    }

    return page;
  }

  async crawl(startUrl: string, options: CrawlOptions = {}): Promise<CrawlResult> {
    const maxDepth = options.maxDepth ?? 2;
    const maxPages = options.maxPages ?? 50;
    const includePatterns = options.includePatterns ?? [];
    const excludePatterns = options.excludePatterns ?? [];

    let visited: Set<string>;
    let pages: PageContent[];
    let errors: { url: Url; error: string }[];
    let startedAt: Date;
    let queue: [string, number][];
    let duplicatesSkipped = 0;

    // Feature 4: Resume from state
    const stateStore = options.stateStore;
    const existingState = stateStore ? await stateStore.load() : undefined;

    if (existingState) {
      visited = new Set(existingState.visited);
      pages = existingState.pages;
      errors = existingState.errors;
      startedAt = existingState.startedAt;
      queue = existingState.queue;
      this.logger.info(
        `Resuming crawl from saved state: ${pages.length} pages, ${queue.length} queued`,
      );
    } else {
      visited = new Set<string>();
      pages = [];
      errors = [];
      startedAt = new Date();
      queue = [[startUrl, 0]];
      visited.add(startUrl);
    }

    // Feature 2: Deduplication
    const simhashes = new Map<string, bigint>();
    const dedup = options.deduplication === true;
    const dedupThreshold = options.deduplicationThreshold ?? 3;

    // Pre-compute simhashes for already-crawled pages (resume case)
    if (dedup && pages.length > 0) {
      for (const page of pages) {
        simhashes.set(page.url, computeSimhash(page.markdown));
      }
    }

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
          // Feature 8: Language filtering
          if (options.languages && options.languages.length > 0) {
            const lang = detectLanguageFromHtml(result.html!);
            if (lang && !options.languages.some((l) => lang.startsWith(l))) {
              this.logger.info(
                `[skip] ${result.url}: language ${lang} not in ${options.languages.join(', ')}`,
              );
              continue;
            }
          }

          const page = this.processHtml(result.url, result.html!);

          // Feature 2: Deduplication check
          if (dedup) {
            const hash = computeSimhash(page.markdown);
            let isDuplicate = false;
            for (const [, existingHash] of simhashes) {
              if (areSimilar(hash, existingHash, dedupThreshold)) {
                isDuplicate = true;
                break;
              }
            }
            if (isDuplicate) {
              duplicatesSkipped++;
              this.logger.info(`[dedup] ${result.url}: skipped as duplicate`);
              continue;
            }
            simhashes.set(result.url, hash);
          }

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

      // Feature 4: Save state after each batch
      if (stateStore) {
        const state: CrawlState = {
          visited: Array.from(visited),
          queue,
          pages,
          errors,
          startedAt,
          startUrl,
        };
        await stateStore.save(state);
      }
    }

    // Feature 4: Clear state on successful completion
    if (stateStore) {
      await stateStore.clear();
    }

    const completedAt = new Date();
    const stats: CrawlStats = {
      totalPages: pages.length,
      totalErrors: errors.length,
      durationMs: toMilliseconds(completedAt.getTime() - startedAt.getTime()),
      startedAt,
      completedAt,
      duplicatesSkipped,
    };

    this.progress.onCrawlComplete(stats);

    return { startUrl: toUrl(startUrl), pages, errors, stats };
  }
}
