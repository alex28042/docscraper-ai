import type { IHttpClient } from '../interfaces/http-client';
import type { IRateLimiter } from '../interfaces/rate-limiter';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; WebScraperSDK/1.0; +https://github.com/web-scraper-sdk)';

export interface UndiciHttpClientOptions {
  userAgent?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

interface UndiciRequestResult {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: {
    text(): Promise<string>;
    dump(): Promise<void>;
  };
}

type UndiciRequestFn = (
  url: string,
  options: Record<string, unknown>,
) => Promise<UndiciRequestResult>;

/**
 * High-performance HTTP client using undici (Node.js built-in HTTP client).
 * Faster than axios for high-throughput scraping scenarios.
 * Requires Node.js 18+ (undici powers the native fetch).
 */
export class UndiciHttpClient implements IHttpClient {
  private readonly userAgent: string;
  private readonly headers: Record<string, string>;
  private readonly defaultTimeoutMs: number;
  private readonly rateLimiter: IRateLimiter;
  private requestFn: UndiciRequestFn | null = null;

  constructor(rateLimiter: IRateLimiter, options: UndiciHttpClientOptions = {}) {
    this.rateLimiter = rateLimiter;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.headers = options.headers ?? {};
    this.defaultTimeoutMs = options.timeoutMs ?? 10_000;
  }

  private async getRequestFn(): Promise<UndiciRequestFn> {
    if (!this.requestFn) {
      const undici = await import('undici');
      this.requestFn = undici.request as unknown as UndiciRequestFn;
    }
    return this.requestFn;
  }

  async fetch(
    url: string,
    options?: { allowAnyContent?: boolean; timeoutMs?: number },
  ): Promise<string> {
    await this.rateLimiter.acquire();

    const request = await this.getRequestFn();
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;

    const { statusCode, headers, body } = await request(url, {
      method: 'GET',
      headers: {
        'user-agent': this.userAgent,
        accept: 'text/html,application/xhtml+xml',
        ...this.headers,
      },
      maxRedirections: 10,
      headersTimeout: timeoutMs,
      bodyTimeout: timeoutMs,
    });

    if (statusCode < 200 || statusCode >= 300) {
      await body.dump();
      throw new Error(`HTTP ${statusCode}`);
    }

    if (!options?.allowAnyContent) {
      const contentType = (headers['content-type'] as string) ?? '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        await body.dump();
        throw new Error(`Unsupported content type: ${contentType}`);
      }
    }

    return await body.text();
  }
}
