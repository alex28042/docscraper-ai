import type { ScraperConfig } from './types';
import type { IHttpClient } from './interfaces/http-client';
import type { ILogger } from './interfaces/logger';
import type { ICache } from './interfaces/cache';
import { NullLogger } from './interfaces/logger';
import { TokenBucketRateLimiter } from './http/rate-limiter';
import { SemaphoreConcurrencyLimiter } from './http/concurrency-limiter';
import { FetchHttpClient } from './http/fetch-http-client';
import { CheerioHtmlParser } from './parsing/parser';
import { TurndownConverter } from './parsing/converter';
import { CheerioLinkExtractor } from './parsing/link-extractor';
import { DuckDuckGoSearchEngine } from './discovery/duckduckgo-engine';
import { Crawler } from './crawling/crawler';
import { Discoverer } from './discovery/discoverer';
import type { RetryOptions } from './http/retry-http-client';

export type HttpClientType = 'fetch' | 'axios' | 'undici';

async function createBaseHttpClient(
  type: HttpClientType,
  rateLimiter: TokenBucketRateLimiter,
  options: { userAgent?: string; headers?: Record<string, string>; timeoutMs?: number },
): Promise<IHttpClient> {
  switch (type) {
    case 'axios': {
      const { AxiosHttpClient } = await import('./http/axios-http-client');
      return new AxiosHttpClient(rateLimiter, options);
    }
    case 'undici': {
      const { UndiciHttpClient } = await import('./http/undici-http-client');
      return new UndiciHttpClient(rateLimiter, options);
    }
    case 'fetch':
    default:
      return new FetchHttpClient(rateLimiter, options);
  }
}

function applyDecorators(
  client: IHttpClient,
  options: { retry?: RetryOptions | boolean; cache?: ICache },
): IHttpClient {
  // Dynamic imports would be async, but these are local modules already loaded
  let decorated = client;

  if (options.cache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CachedHttpClient } = require('./http/cached-http-client');
    decorated = new CachedHttpClient(decorated, options.cache);
  }

  if (options.retry) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RetryHttpClient } = require('./http/retry-http-client');
    const retryOpts = options.retry === true ? {} : options.retry;
    decorated = new RetryHttpClient(decorated, retryOpts);
  }

  return decorated;
}

export interface CreateCrawlerOptions extends ScraperConfig {
  httpClient?: HttpClientType;
  /** Enable retry with exponential backoff. true = defaults, or pass RetryOptions. */
  retry?: RetryOptions | boolean;
  /** Provide a cache instance to avoid re-fetching pages. */
  cache?: ICache;
}

export async function createDefaultCrawler(
  config: CreateCrawlerOptions = {},
  logger?: ILogger,
): Promise<Crawler> {
  const rateLimiter = new TokenBucketRateLimiter(config.rateLimit ?? 5);
  const concurrencyLimiter = new SemaphoreConcurrencyLimiter(config.concurrency ?? 3);

  let httpClient = await createBaseHttpClient(config.httpClient ?? 'fetch', rateLimiter, {
    userAgent: config.userAgent,
    headers: config.headers,
    timeoutMs: config.timeoutMs,
  });

  httpClient = applyDecorators(httpClient, {
    cache: config.cache,
    retry: config.retry,
  });

  const parser = new CheerioHtmlParser();
  const converter = new TurndownConverter();
  const linkExtractor = new CheerioLinkExtractor();

  return new Crawler(
    httpClient,
    concurrencyLimiter,
    parser,
    converter,
    linkExtractor,
    logger ?? new NullLogger(),
  );
}

export async function createDefaultDiscoverer(
  httpClientType: HttpClientType = 'fetch',
): Promise<Discoverer> {
  const rateLimiter = new TokenBucketRateLimiter(2);
  const httpClient = await createBaseHttpClient(httpClientType, rateLimiter, {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    timeoutMs: 15_000,
  });
  const searchEngine = new DuckDuckGoSearchEngine(httpClient);
  return new Discoverer(searchEngine);
}
