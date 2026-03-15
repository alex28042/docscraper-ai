import type { ScraperConfig } from '../types';
import type { ILogger } from '../interfaces/logger';
import type { ICache } from '../interfaces/cache';
import { NullLogger } from '../interfaces/logger';
import { TokenBucketRateLimiter } from '../http/rate-limiter';
import { SemaphoreConcurrencyLimiter } from '../http/concurrency-limiter';
import { CachedHttpClient } from '../http/cached-http-client';
import { RetryHttpClient } from '../http/retry-http-client';
import type { RetryOptions } from '../http/retry-http-client';
import { CheerioHtmlParser } from '../parsing/parser';
import { TurndownConverter } from '../parsing/converter';
import { CheerioLinkExtractor } from '../parsing/link-extractor';
import { CheerioMetadataExtractor } from '../parsing/metadata-extractor';
import { Crawler } from '../crawling/crawler';
import { HttpClientFactory } from './http-client-factory';
import type { HttpClientType } from './http-client-factory';

export interface CreateCrawlerOptions extends ScraperConfig {
  httpClient?: HttpClientType;
  retry?: RetryOptions | boolean;
  cache?: ICache;
}

export class CrawlerFactory {
  private readonly config: CreateCrawlerOptions;
  private readonly logger: ILogger;

  constructor(config: CreateCrawlerOptions = {}, logger?: ILogger) {
    this.config = config;
    this.logger = logger ?? new NullLogger();
  }

  async create(): Promise<Crawler> {
    const rateLimiter = new TokenBucketRateLimiter(this.config.rateLimit ?? 5);
    const concurrencyLimiter = new SemaphoreConcurrencyLimiter(this.config.concurrency ?? 3);

    const httpClientFactory = new HttpClientFactory(this.config.httpClient, {
      userAgent: this.config.userAgent,
      headers: this.config.headers,
      timeoutMs: this.config.timeoutMs,
    });

    let httpClient = await httpClientFactory.create(rateLimiter);

    if (this.config.retry) {
      const retryOpts = this.config.retry === true ? {} : this.config.retry;
      httpClient = new RetryHttpClient(httpClient, retryOpts);
    }

    if (this.config.cache) {
      httpClient = new CachedHttpClient(httpClient, this.config.cache);
    }

    const parser = new CheerioHtmlParser();
    const converter = new TurndownConverter();
    const linkExtractor = new CheerioLinkExtractor();
    const metadataExtractor = new CheerioMetadataExtractor();

    return new Crawler(
      httpClient,
      concurrencyLimiter,
      parser,
      converter,
      linkExtractor,
      this.logger,
      undefined,
      metadataExtractor,
    );
  }
}
