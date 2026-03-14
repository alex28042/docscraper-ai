import type { IHttpClient } from '../interfaces/http-client';
import type { IRateLimiter } from '../interfaces/rate-limiter';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; WebScraperSDK/1.0; +https://github.com/web-scraper-sdk)';

export interface FetchHttpClientOptions {
  userAgent?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class FetchHttpClient implements IHttpClient {
  private readonly userAgent: string;
  private readonly headers: Record<string, string>;
  private readonly defaultTimeoutMs: number;
  private readonly rateLimiter: IRateLimiter;

  constructor(rateLimiter: IRateLimiter, options: FetchHttpClientOptions = {}) {
    this.rateLimiter = rateLimiter;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.headers = options.headers ?? {};
    this.defaultTimeoutMs = options.timeoutMs ?? 10_000;
  }

  async fetch(
    url: string,
    options?: { allowAnyContent?: boolean; timeoutMs?: number },
  ): Promise<string> {
    await this.rateLimiter.acquire();

    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await globalThis.fetch(url, {
        signal: controller.signal,
        keepalive: true,
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml',
          ...this.headers,
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!options?.allowAnyContent) {
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
          throw new Error(`Unsupported content type: ${contentType}`);
        }
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }
}
